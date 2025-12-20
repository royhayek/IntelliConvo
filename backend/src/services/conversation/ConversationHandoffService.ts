/**
 * Conversation Handoff Service
 * Handles AI-to-human agent handoff logic
 */

import { prisma } from '../../lib/prisma';
import { ConversationStatus, ConversationRole } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AppError, ErrorCode } from '../../middleware/errors';

export class ConversationHandoffService {
  /**
   * Escalate a conversation to a human agent
   */
  async escalateConversation(
    conversationId: string,
    reason?: string
  ): Promise<{ success: boolean; conversationId: string; status: ConversationStatus }> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { site: true },
      });

      if (!conversation) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Conversation not found');
      }

      // Check if already escalated
      if (
        conversation.status === ConversationStatus.NEEDS_AGENT ||
        conversation.status === ConversationStatus.AGENT_ACTIVE
      ) {
        return {
          success: true,
          conversationId: conversation.id,
          status: conversation.status,
        };
      }

      // Update conversation status
      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.NEEDS_AGENT,
          escalatedAt: new Date(),
          escalationReason: reason || 'User requested human agent',
        },
      });

      logger.info(`Conversation ${conversationId} escalated to human agent`);

      return {
        success: true,
        conversationId: updated.id,
        status: updated.status,
      };
    } catch (error) {
      logger.error('Error escalating conversation:', error);
      throw error;
    }
  }

  /**
   * Agent takes a conversation
   */
  async takeConversation(
    conversationId: string,
    agentId: string
  ): Promise<{ success: boolean; conversationId: string }> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Conversation not found');
      }

      if (conversation.status !== ConversationStatus.NEEDS_AGENT) {
        throw new AppError(400, ErrorCode.INVALID_STATE, 'Conversation is not waiting for an agent');
      }

      // Assign agent and update status
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.AGENT_ACTIVE,
          assignedAgentId: agentId,
          agentJoinedAt: new Date(),
        },
      });

      logger.info(`Agent ${agentId} took conversation ${conversationId}`);

      return {
        success: true,
        conversationId,
      };
    } catch (error) {
      logger.error('Error taking conversation:', error);
      throw error;
    }
  }

  /**
   * Agent sends a message
   */
  async sendAgentMessage(
    conversationId: string,
    agentId: string,
    content: string
  ): Promise<any> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Conversation not found');
      }

      // Verify agent is assigned
      if (conversation.assignedAgentId !== agentId) {
        throw new AppError(403, ErrorCode.FORBIDDEN, 'You are not assigned to this conversation');
      }

      // Create agent message
      const message = await prisma.message.create({
        data: {
          conversationId,
          role: ConversationRole.AGENT,
          content,
          agentId,
        },
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

      return message;
    } catch (error) {
      logger.error('Error sending agent message:', error);
      throw error;
    }
  }

  /**
   * Resolve a conversation (agent marks as complete)
   */
  async resolveConversation(
    conversationId: string,
    agentId: string,
    notes?: string
  ): Promise<{ success: boolean }> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Conversation not found');
      }

      // Verify agent is assigned
      if (conversation.assignedAgentId !== agentId) {
        throw new AppError(403, ErrorCode.FORBIDDEN, 'You are not assigned to this conversation');
      }

      // Mark as resolved
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.RESOLVED,
          resolvedAt: new Date(),
          agentNotes: notes,
        },
      });

      logger.info(`Conversation ${conversationId} resolved by agent ${agentId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error resolving conversation:', error);
      throw error;
    }
  }

  /**
   * Update agent notes
   */
  async updateAgentNotes(
    conversationId: string,
    agentId: string,
    notes: string
  ): Promise<{ success: boolean }> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, ErrorCode.NOT_FOUND, 'Conversation not found');
      }

      // Verify agent is assigned or has permission
      if (conversation.assignedAgentId !== agentId) {
        throw new AppError(403, ErrorCode.FORBIDDEN, 'You are not assigned to this conversation');
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { agentNotes: notes },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error updating agent notes:', error);
      throw error;
    }
  }

  /**
   * Get queue of conversations waiting for agents
   */
  async getQueue(userId: string): Promise<any[]> {
    try {
      // Get user's sites to filter conversations
      const sites = await prisma.site.findMany({
        where: { userId },
        select: { id: true },
      });

      const siteIds = sites.map((s) => s.id);

      const conversations = await prisma.conversation.findMany({
        where: {
          siteId: { in: siteIds },
          status: ConversationStatus.NEEDS_AGENT,
        },
        include: {
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
            },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          escalatedAt: 'asc', // First in, first served
        },
      });

      return conversations;
    } catch (error) {
      logger.error('Error getting conversation queue:', error);
      throw error;
    }
  }

  /**
   * Get active conversations for an agent
   */
  async getAgentActiveConversations(agentId: string): Promise<any[]> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          assignedAgentId: agentId,
          status: ConversationStatus.AGENT_ACTIVE,
        },
        include: {
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
            },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      return conversations;
    } catch (error) {
      logger.error('Error getting agent active conversations:', error);
      throw error;
    }
  }

  /**
   * Get count of conversations waiting for agents (for a user's sites)
   */
  async getQueueCount(userId: string): Promise<number> {
    try {
      const sites = await prisma.site.findMany({
        where: { userId },
        select: { id: true },
      });

      const siteIds = sites.map((s) => s.id);

      const count = await prisma.conversation.count({
        where: {
          siteId: { in: siteIds },
          status: ConversationStatus.NEEDS_AGENT,
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting queue count:', error);
      throw error;
    }
  }
}

export const conversationHandoffService = new ConversationHandoffService();
