import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import { ConversationRole } from '@prisma/client';

interface MessageListParams {
  page: number;
  limit: number;
  conversationId?: string;
  siteId?: string;
  role?: ConversationRole;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'timestamp';
  sortOrder?: 'asc' | 'desc';
}

interface MessageListResult {
  messages: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminMessageService {
  /**
   * Get paginated list of messages with filters
   */
  async getMessages(params: MessageListParams): Promise<MessageListResult> {
    const {
      page = 1,
      limit = 20,
      conversationId,
      siteId,
      role,
      dateFrom,
      dateTo,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Conversation filter
    if (conversationId) {
      where.conversationId = conversationId;
    }

    // Site filter (via conversation)
    if (siteId) {
      where.conversation = { siteId };
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          conversation: {
            select: {
              id: true,
              sessionId: true,
              userIdentifier: true,
              site: {
                select: {
                  id: true,
                  siteName: true,
                  user: {
                    select: {
                      id: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            id: true,
            sessionId: true,
            userIdentifier: true,
            startedAt: true,
            site: {
              select: {
                id: true,
                siteName: true,
                siteUrl: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    return message;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    // Update conversation message count
    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: {
        messageCount: { decrement: 1 },
      },
    });

    return { success: true };
  }

  /**
   * Get message statistics
   */
  async getMessageStats() {
    const [totalMessages, byRole, tokenStats] = await Promise.all([
      prisma.message.count(),
      prisma.message.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.message.aggregate({
        _sum: {
          tokensUsed: true,
          costInCents: true,
        },
        _avg: {
          tokensUsed: true,
        },
      }),
    ]);

    return {
      totalMessages,
      byRole: byRole.map((r) => ({
        role: r.role,
        count: r._count.id,
      })),
      totalTokensUsed: tokenStats._sum.tokensUsed || 0,
      totalCostCents: tokenStats._sum.costInCents || 0,
      avgTokensPerMessage: tokenStats._avg.tokensUsed || 0,
    };
  }
}

export const adminMessageService = new AdminMessageService();
