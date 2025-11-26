import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { streamResponseWithUsage } from './ai';
import { logger } from '../utils/logger';
import { ConversationRole } from '@prisma/client';
import { adminStatsService } from './admin';
import { isOriginAllowed } from '../utils/hostValidation';

// Store IO instance for broadcasting from other parts of the app
let ioInstance: Server | null = null;

/**
 * Helper to serialize objects with BigInt values for JSON transmission
 * Converts BigInt to number (safe for values < Number.MAX_SAFE_INTEGER)
 */
function serializeForJSON<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

export function getIO(): Server | null {
  return ioInstance;
}

/**
 * Broadcast admin stats update to all connected admin clients
 */
export async function broadcastAdminStats(): Promise<void> {
  if (!ioInstance) return;

  try {
    const stats = await adminStatsService.getDashboardStats();
    ioInstance.to('admin-dashboard').emit('stats-update', serializeForJSON(stats));
  } catch (error) {
    logger.error('Error broadcasting admin stats:', error);
  }
}

/**
 * Emit force logout event to a specific user
 * This will notify all connected clients for that user to logout immediately
 */
export function emitForceLogout(userId: string): void {
  if (!ioInstance) {
    logger.warn('Socket.IO not initialized, cannot emit force logout');
    return;
  }

  ioInstance.to(`user:${userId}`).emit('force-logout', {
    message: 'Your session has been terminated by an administrator.',
  });
  logger.info(`Force logout event emitted to user ${userId}`);
}

interface ChatMessage {
  sessionId: string;
  siteId: string;
  content: string;
}

export function initializeSocketIO(io: Server): void {
  // Store IO instance for external broadcasts
  ioInstance = io;

  // Socket.IO middleware for origin validation
  // This validates widget connections against site-specific allowed hosts
  io.use(async (socket, next) => {
    const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;

    // Skip validation if no origin (shouldn't happen in browsers)
    if (!origin) {
      return next();
    }

    // Admin connections are validated by JWT auth, skip host validation
    const isAdminConnection = socket.handshake.auth?.token;
    if (isAdminConnection) {
      return next();
    }

    // For widget connections, we validate on first message with siteId
    // Here we just log the origin for debugging
    logger.debug(`Socket connection from origin: ${origin}`);
    next();
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Admin dashboard room - join when admin connects
    socket.on('join-admin-dashboard', async () => {
      socket.join('admin-dashboard');
      logger.info(`Socket ${socket.id} joined admin dashboard`);

      // Send initial stats
      try {
        const stats = await adminStatsService.getDashboardStats();
        socket.emit('stats-update', serializeForJSON(stats));
      } catch (error) {
        logger.error('Error sending initial admin stats:', error);
      }
    });

    // Leave admin dashboard room
    socket.on('leave-admin-dashboard', () => {
      socket.leave('admin-dashboard');
      logger.info(`Socket ${socket.id} left admin dashboard`);
    });

    // Join site room
    socket.on('join-site', async (siteId: string) => {
      socket.join(`site:${siteId}`);
      logger.info(`Socket ${socket.id} joined site ${siteId}`);
    });

    // Join user room for notifications
    socket.on('join-user', async (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info(`Socket ${socket.id} joined user room ${userId}`);
    });

    // Leave user room
    socket.on('leave-user', (userId: string) => {
      socket.leave(`user:${userId}`);
      logger.info(`Socket ${socket.id} left user room ${userId}`);
    });

    // Handle chat messages
    socket.on('message', async (data: ChatMessage) => {
      try {
        const { sessionId, siteId, content } = data;

        // Validate origin against site's allowed hosts and check subscription status
        const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;
        const site = await prisma.site.findUnique({
          where: { id: siteId },
          include: {
            activeHosts: true,
            subscription: {
              select: {
                status: true,
                trialEndsAt: true,
              },
            },
          },
        });

        if (!site) {
          socket.emit('error', {
            message: 'Site not found',
            code: 'NOT_FOUND',
          });
          return;
        }

        // Check subscription status - only allow TRIAL or ACTIVE subscriptions
        if (site.subscription) {
          const subscriptionStatus = site.subscription.status;
          if (subscriptionStatus !== 'TRIAL' && subscriptionStatus !== 'ACTIVE') {
            socket.emit('error', {
              message: 'Your subscription is not active. Please check your billing settings.',
              code: 'SUBSCRIPTION_INACTIVE',
            });
            return;
          }
        }

        // Validate origin
        if (origin && site.activeHosts.length > 0) {
          const allowedHosts = site.activeHosts
            .filter((host) => host.isEnabled)
            .map((host) => host.hostName);

          if (!isOriginAllowed(origin, allowedHosts)) {
            logger.warn(`Origin ${origin} not allowed for site ${siteId}`);
            socket.emit('error', {
              message: 'Origin not allowed',
              code: 'FORBIDDEN',
            });
            return;
          }
        }

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
          where: { sessionId, siteId },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              siteId,
              sessionId,
              userAgent: socket.handshake.headers['user-agent'],
              ipAddress: socket.handshake.address,
            },
          });
        }

        // Save user message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: ConversationRole.USER,
            content,
          },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          },
        });

        // Send typing indicator
        socket.emit('typing', { isTyping: true });

        // Stream AI response
        let fullResponse = '';

        try {
          const { tokensUsed, costInCents } = await streamResponseWithUsage(
            {
              siteId,
              conversationId: conversation.id,
              message: content,
            },
            (chunk) => {
              fullResponse += chunk;
              socket.emit('stream', { chunk });
            }
          );

          // Save AI response with token usage and cost
          const message = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: ConversationRole.ASSISTANT,
              content: fullResponse,
              tokensUsed,
              costInCents,
            },
          });

          // Update conversation
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              messageCount: { increment: 1 },
            },
          });

          // Send complete event
          socket.emit('complete', {
            messageId: message.id,
            content: fullResponse,
          });
        } catch (error) {
          logger.error('Error generating AI response:', error);
          socket.emit('error', {
            message: 'I apologize, but I encountered an error. Please try again.',
          });
        } finally {
          socket.emit('typing', { isTyping: false });
        }
      } catch (error) {
        logger.error('Socket message error:', error);
        socket.emit('error', {
          message: 'An error occurred processing your message.',
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}