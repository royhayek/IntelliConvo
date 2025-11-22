import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { streamResponse } from './ai';
import { logger } from '../utils/logger';
import { ConversationRole } from '@prisma/client';
import { adminStatsService } from './admin';

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

interface ChatMessage {
  sessionId: string;
  siteId: string;
  content: string;
}

export function initializeSocketIO(io: Server): void {
  // Store IO instance for external broadcasts
  ioInstance = io;

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
        let tokensUsed = 0;

        try {
          for await (const chunk of streamResponse({
            siteId,
            conversationId: conversation.id,
            message: content,
          })) {
            fullResponse += chunk;
            socket.emit('stream', { chunk });
          }

          // Save AI response
          const message = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: ConversationRole.ASSISTANT,
              content: fullResponse,
              tokensUsed,
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