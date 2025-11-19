import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { streamResponse } from './ai';
import { logger } from '../utils/logger';
import { ConversationRole } from '@prisma/client';

interface ChatMessage {
  sessionId: string;
  siteId: string;
  content: string;
}

export function initializeSocketIO(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join site room
    socket.on('join-site', async (siteId: string) => {
      socket.join(`site:${siteId}`);
      logger.info(`Socket ${socket.id} joined site ${siteId}`);
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