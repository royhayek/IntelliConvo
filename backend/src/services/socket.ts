import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { streamResponseWithUsage } from './ai';
import { logger } from '../utils/logger';
import { ConversationRole, ConversationStatus } from '@prisma/client';
import { adminStatsService } from './admin';
import { isOriginAllowed } from '../utils/hostValidation';
import { getConfig } from '../config';
import { conversationHandoffService } from './conversation/ConversationHandoffService';

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

/**
 * Broadcast conversation escalation to all agents monitoring a site
 */
export async function broadcastConversationEscalated(conversationId: string, siteId: string): Promise<void> {
  if (!ioInstance) return;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        site: { select: { siteName: true, siteUrl: true } },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (conversation) {
      // Notify all agents monitoring this site
      ioInstance.to(`site:${siteId}`).emit('conversation-escalated', serializeForJSON(conversation));
      logger.info(`Conversation ${conversationId} escalation broadcast to site ${siteId}`);
    }
  } catch (error) {
    logger.error('Error broadcasting conversation escalation:', error);
  }
}

/**
 * Broadcast conversation status change
 */
export function broadcastConversationStatusChange(
  conversationId: string,
  status: ConversationStatus,
  data?: any
): void {
  if (!ioInstance) return;

  ioInstance.to(`conversation:${conversationId}`).emit('conversation-status-changed', {
    conversationId,
    status,
    ...data,
  });
  logger.info(`Conversation ${conversationId} status changed to ${status}`);
}

/**
 * Broadcast new message in conversation (for real-time updates in dashboard)
 */
export function broadcastConversationMessage(conversationId: string, message: any): void {
  if (!ioInstance) return;

  ioInstance.to(`conversation:${conversationId}`).emit('conversation-message', serializeForJSON(message));
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
    socket.on('message', async (data: ChatMessage & { isTest?: boolean }) => {
      try {
        const { sessionId, siteId, content, isTest = false } = data;

        // Validate origin against site's allowed hosts and check subscription status
        const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;
        const config = getConfig();
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

        // Validate origin (skip validation for test conversations from playground)
        if (!isTest && origin && site.activeHosts.length > 0) {
          const allowedHosts = site.activeHosts
            .filter((host) => host.isEnabled)
            .map((host) => host.hostName);

          // In development mode, automatically allow localhost and 127.0.0.1 origins
          const isDevelopment = config.NODE_ENV === 'development';
          const isLocalhostOrigin = origin.includes('localhost') || origin.includes('127.0.0.1');

          if (!isOriginAllowed(origin, allowedHosts) && !(isDevelopment && isLocalhostOrigin)) {
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
              isTest,
            },
          });
        }

        // Save user message
        const userMessage = await prisma.message.create({
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

        // Check if agent is active - if yes, route to agent instead of AI
        if (conversation.status === ConversationStatus.AGENT_ACTIVE) {
          logger.info(`Routing message to agent for conversation ${conversation.id}`);

          // Broadcast user message to agent dashboard
          broadcastConversationMessage(conversation.id, userMessage);

          // Acknowledge message receipt and stop any typing indicators in the widget
          socket.emit('message-routed-to-agent', {
            conversationId: conversation.id,
            messageId: userMessage.id,
          });

          // Don't send to AI, agent will handle it
          return;
        }

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

          // Detect if AI suggested handoff
          const suggestsHandoff = fullResponse.toLowerCase().includes('connect you with a human agent');

          // Send complete event
          socket.emit('complete', {
            messageId: message.id,
            conversationId: conversation.id,
            content: fullResponse,
            suggestsHandoff,
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

    // ============================================
    // HUMAN HANDOFF EVENTS
    // ============================================

    // Join a specific conversation room for real-time updates
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // User requests human agent (from widget)
    socket.on('request-agent', async (data: { conversationId: string; reason?: string }) => {
      try {
        const { conversationId, reason } = data;

        const result = await conversationHandoffService.escalateConversation(conversationId, reason);

        // Get conversation details to find siteId
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            site: {
              include: {
                widgetSettings: {
                  select: {
                    waitingForAgentMessage: true,
                  },
                },
              },
            },
          },
        });

        if (conversation) {
          // Notify the user
          socket.emit('escalation-confirmed', {
            success: true,
            message: conversation.site.widgetSettings?.waitingForAgentMessage || 'Please wait while we connect you to an agent...',
          });

          // Broadcast to agents monitoring this site
          await broadcastConversationEscalated(conversationId, conversation.siteId);
        }
      } catch (error) {
        logger.error('Error handling agent request:', error);
        socket.emit('error', {
          message: 'Failed to request human agent',
        });
      }
    });

    // Agent takes a conversation
    socket.on('agent-take-conversation', async (data: { conversationId: string; agentId: string }) => {
      try {
        const { conversationId, agentId } = data;

        await conversationHandoffService.takeConversation(conversationId, agentId);

        // Get conversation and widget settings
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            assignedAgent: {
              select: {
                id: true,
                fullName: true,
              },
            },
            site: {
              include: {
                widgetSettings: {
                  select: {
                    agentJoinedMessage: true,
                  },
                },
              },
            },
          },
        });

        if (conversation) {
          // Notify the user in the widget
          ioInstance?.to(`conversation:${conversationId}`).emit('agent-joined', {
            agentName: conversation.assignedAgent?.fullName || 'Agent',
            message: conversation.site.widgetSettings?.agentJoinedMessage || 'An agent has joined the conversation',
          });

          // Notify dashboard viewers
          broadcastConversationStatusChange(conversationId, ConversationStatus.AGENT_ACTIVE, {
            assignedAgentId: agentId,
          });

          socket.emit('conversation-taken', { success: true, conversationId });
        }
      } catch (error) {
        logger.error('Error taking conversation:', error);
        socket.emit('error', {
          message: 'Failed to take conversation',
        });
      }
    });

    // Agent sends a message
    socket.on('agent-send-message', async (data: { conversationId: string; agentId: string; content: string }) => {
      try {
        const { conversationId, agentId, content } = data;

        const message = await conversationHandoffService.sendAgentMessage(conversationId, agentId, content);

        // Broadcast message to all participants (user in widget and dashboard viewers)
        broadcastConversationMessage(conversationId, message);

        socket.emit('message-sent', { success: true, message });
      } catch (error) {
        logger.error('Error sending agent message:', error);
        socket.emit('error', {
          message: 'Failed to send message',
        });
      }
    });

    // Agent typing indicator
    socket.on('agent-typing', (data: { conversationId: string; isTyping: boolean }) => {
      const { conversationId, isTyping } = data;
      // Broadcast to user in widget
      ioInstance?.to(`conversation:${conversationId}`).emit('agent-typing', { isTyping });
    });

    // Agent resolves conversation
    socket.on('agent-resolve-conversation', async (data: { conversationId: string; agentId: string; notes?: string }) => {
      try {
        const { conversationId, agentId, notes } = data;

        await conversationHandoffService.resolveConversation(conversationId, agentId, notes);

        // Get widget settings for message
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            site: {
              include: {
                widgetSettings: {
                  select: {
                    agentLeftMessage: true,
                  },
                },
              },
            },
          },
        });

        if (conversation) {
          // Notify user in widget that conversation is resolved
          ioInstance?.to(`conversation:${conversationId}`).emit('conversation-resolved', {
            conversationId,
            message: 'Your conversation has been resolved. Thank you for contacting us!',
            requestFeedback: true,
          });

          // Notify dashboard viewers
          broadcastConversationStatusChange(conversationId, ConversationStatus.RESOLVED);

          socket.emit('conversation-resolved', { success: true });
        }
      } catch (error) {
        logger.error('Error resolving conversation:', error);
        socket.emit('error', {
          message: 'Failed to resolve conversation',
        });
      }
    });

    // Submit feedback rating
    socket.on('submit-feedback', async (data: { conversationId: string; rating: number; comment?: string }) => {
      try {
        const { conversationId, rating, comment } = data;

        // Validate rating (1-5 stars)
        if (rating < 1 || rating > 5) {
          socket.emit('error', {
            message: 'Rating must be between 1 and 5',
          });
          return;
        }

        // Update conversation with feedback
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            feedbackRating: rating,
            feedbackComment: comment || null,
          },
        });

        logger.info(`Feedback submitted for conversation ${conversationId}: ${rating} stars`);
        socket.emit('feedback-submitted', { success: true });
      } catch (error) {
        logger.error('Error submitting feedback:', error);
        socket.emit('error', {
          message: 'Failed to submit feedback',
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}