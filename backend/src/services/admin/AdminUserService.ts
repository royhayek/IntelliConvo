import { prisma } from '../../lib/prisma';
import { NotFoundError, AlreadyExistsError, ValidationError } from '../../middleware/errors';
import { AuthProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { deleteSiteEmbeddings } from '../embeddings';
import { emitForceLogout } from '../socket';

interface UserListParams {
  page: number;
  limit: number;
  search?: string;
  authProvider?: AuthProvider;
  isAdmin?: boolean;
  sortBy?: 'createdAt' | 'lastLoginAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

interface UserListResult {
  users: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UpdateUserData {
  fullName?: string;
  email?: string;
  isAdmin?: boolean;
}

interface CreateUserData {
  email: string;
  password: string;
  fullName?: string;
  isAdmin?: boolean;
}

class AdminUserService {
  /**
   * Get paginated list of users with search and filters
   */
  async getUsers(params: UserListParams): Promise<UserListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      authProvider,
      isAdmin,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Auth provider filter
    if (authProvider) {
      where.authProvider = authProvider;
    }

    // Admin filter
    if (isAdmin !== undefined) {
      where.isAdmin = isAdmin;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          authProvider: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              sites: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        ...user,
        sitesCount: user._count.sites,
        subscriptionsCount: user._count.subscriptions,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID with full details
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sites: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            crawlStatus: true,
            createdAt: true,
            _count: {
              select: {
                urls: true,
                conversations: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          select: {
            id: true,
            planType: true,
            status: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            site: {
              select: {
                id: true,
                siteName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        billingInfo: true,
        billingHistory: {
          select: {
            id: true,
            invoiceId: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Get active sessions count
    const activeSessions = await prisma.refreshToken.count({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
    });

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;

    return {
      ...safeUser,
      activeSessions,
    };
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.isAdmin !== undefined && { isAdmin: data.isAdmin }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        authProvider: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user permanently (GDPR compliant - right to be forgotten)
   * Cascades to all related data due to schema configuration
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Get all sites for this user to delete Pinecone embeddings
    const userSites = await prisma.site.findMany({
      where: { userId },
      select: { id: true },
    });

    // Delete Pinecone embeddings for each site BEFORE database cascade delete
    for (const site of userSites) {
      await deleteSiteEmbeddings(site.id);
    }

    // Invalidate all sessions
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Hard delete user (cascades to all related data due to schema)
    await prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'User and all associated data have been permanently deleted'
    };
  }

  /**
   * Force logout user by invalidating all their sessions
   * Sets forceLogoutAt to invalidate all existing access tokens immediately
   */
  async forceLogout(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Use transaction to ensure both operations succeed
    const [, result] = await prisma.$transaction([
      // Set forceLogoutAt to invalidate all existing access tokens
      prisma.user.update({
        where: { id: userId },
        data: { forceLogoutAt: new Date() },
      }),
      // Delete all refresh tokens for this user
      prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);

    // Emit force logout event via Socket.io to immediately notify the user
    emitForceLogout(userId);

    return {
      success: true,
      sessionsRevoked: result.count,
    };
  }

  /**
   * Create a new user (admin can create users including other admins)
   */
  async createUser(data: CreateUserData) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AlreadyExistsError('User', 'email');
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName || null,
        authProvider: AuthProvider.EMAIL,
        passwordHash,
        isAdmin: data.isAdmin || false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        authProvider: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Export users as CSV or JSON
   */
  async exportUsers(format: 'csv' | 'json', filters?: UserListParams) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.authProvider) {
      where.authProvider = filters.authProvider;
    }

    if (filters?.isAdmin !== undefined) {
      where.isAdmin = filters.isAdmin;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        authProvider: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            sites: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      authProvider: user.authProvider,
      isAdmin: user.isAdmin,
      sitesCount: user._count.sites,
      subscriptionsCount: user._count.subscriptions,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || '',
    }));

    if (format === 'json') {
      return {
        format: 'json',
        data: exportData,
        count: exportData.length,
      };
    }

    // CSV format
    const headers = ['id', 'email', 'fullName', 'authProvider', 'isAdmin', 'sitesCount', 'subscriptionsCount', 'createdAt', 'updatedAt', 'lastLoginAt'];
    const csvRows = [
      headers.join(','),
      ...exportData.map((row) =>
        headers.map((header) => {
          const value = row[header as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ),
    ];

    return {
      format: 'csv',
      data: csvRows.join('\n'),
      count: exportData.length,
    };
  }
}

export const adminUserService = new AdminUserService();
