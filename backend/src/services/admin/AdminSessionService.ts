/**
 * Admin Session Service
 * Service for managing user sessions (refresh tokens) from the admin panel
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';

interface GetSessionsOptions {
  page: number;
  limit: number;
  userId?: string;
  expired?: boolean;
  sortBy?: 'createdAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

class AdminSessionService {
  /**
   * Get paginated list of sessions with user info
   */
  async getSessions(options: GetSessionsOptions) {
    const {
      page = 1,
      limit = 20,
      userId,
      expired,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const now = new Date();

    // Build where clause
    const where: {
      userId?: string;
      expiresAt?: { lt?: Date; gt?: Date };
    } = {};

    if (userId) {
      where.userId = userId;
    }

    if (expired === true) {
      where.expiresAt = { lt: now };
    } else if (expired === false) {
      where.expiresAt = { gt: now };
    }

    const [sessions, total] = await Promise.all([
      prisma.refreshToken.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.refreshToken.count({ where }),
    ]);

    // Fetch user info for sessions
    const userIds = [...new Set(sessions.map((s) => s.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Map sessions with user info and mask token
    const sessionsWithUsers = sessions.map((session) => ({
      id: session.id,
      tokenPreview: `${session.token.substring(0, 8)}...${session.token.substring(session.token.length - 8)}`,
      userId: session.userId,
      user: userMap.get(session.userId) || null,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      isExpired: session.expiresAt < now,
    }));

    return {
      sessions: sessionsWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get sessions for a specific user
   */
  async getUserSessions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const now = new Date();
    const sessions = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user,
      sessions: sessions.map((session) => ({
        id: session.id,
        tokenPreview: `${session.token.substring(0, 8)}...${session.token.substring(session.token.length - 8)}`,
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        isExpired: session.expiresAt < now,
      })),
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.expiresAt > now).length,
    };
  }

  /**
   * Revoke a specific session (delete refresh token)
   */
  async revokeSession(sessionId: string) {
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    await prisma.refreshToken.delete({
      where: { id: sessionId },
    });

    return { success: true, message: 'Session revoked successfully' };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return {
      success: true,
      message: `Cleaned up ${result.count} expired sessions`,
      count: result.count,
    };
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalSessions,
      activeSessions,
      expiredSessions,
      sessionsCreatedLast24h,
      usersWithMultipleSessions,
    ] = await Promise.all([
      prisma.refreshToken.count(),
      prisma.refreshToken.count({
        where: { expiresAt: { gt: now } },
      }),
      prisma.refreshToken.count({
        where: { expiresAt: { lt: now } },
      }),
      prisma.refreshToken.count({
        where: { createdAt: { gte: yesterday } },
      }),
      prisma.refreshToken.groupBy({
        by: ['userId'],
        having: {
          userId: {
            _count: { gt: 1 },
          },
        },
      }).then((groups) => groups.length),
    ]);

    return {
      totalSessions,
      activeSessions,
      expiredTokensNeedingCleanup: expiredSessions,
      sessionsCreatedLast24h,
      usersWithMultipleSessions,
    };
  }
}

export const adminSessionService = new AdminSessionService();
