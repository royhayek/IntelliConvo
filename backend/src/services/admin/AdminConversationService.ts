import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';

interface ConversationListParams {
  page: number;
  limit: number;
  siteId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'startedAt' | 'lastMessageAt' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
}

interface ConversationListResult {
  conversations: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminConversationService {
  /**
   * Get paginated list of conversations with filters
   */
  async getConversations(params: ConversationListParams): Promise<ConversationListResult> {
    const {
      page = 1,
      limit = 20,
      siteId,
      search,
      dateFrom,
      dateTo,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Site filter
    if (siteId) {
      where.siteId = siteId;
    }

    // Search filter (session ID or user identifier)
    if (search) {
      where.OR = [
        { sessionId: { contains: search, mode: 'insensitive' } },
        { userIdentifier: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.startedAt = {};
      if (dateFrom) where.startedAt.gte = dateFrom;
      if (dateTo) where.startedAt.lte = dateTo;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
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
          assignedAgent: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          messages: {
            select: {
              tokensUsed: true,
              costInCents: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      conversations: conversations.map((conv) => {
        // Calculate total tokens and cost from messages
        const totalTokens = conv.messages.reduce((sum, msg) => sum + (msg.tokensUsed || 0), 0);
        const totalCostCents = conv.messages.reduce((sum, msg) => sum + (msg.costInCents || 0), 0);

        return {
          ...conv,
          messageCount: conv._count.messages,
          totalTokens,
          totalCostCents,
          messages: undefined, // Remove messages from response
          _count: undefined,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversation by ID with messages
   */
  async getConversationById(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
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
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }

    // Calculate token usage
    const tokenStats = conversation.messages.reduce(
      (acc, msg) => {
        acc.totalTokens += msg.tokensUsed || 0;
        acc.totalCost += msg.costInCents || 0;
        return acc;
      },
      { totalTokens: 0, totalCost: 0 }
    );

    return {
      ...conversation,
      stats: {
        messagesCount: conversation.messages.length,
        totalTokens: tokenStats.totalTokens,
        totalCostCents: tokenStats.totalCost,
      },
    };
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  /**
   * Delete all conversations for a site
   */
  async deleteSiteConversations(siteId: string) {
    const result = await prisma.conversation.deleteMany({
      where: { siteId },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  }

  /**
   * Get conversation statistics for a site
   */
  async getSiteConversationStats(siteId: string) {
    const [totalConversations, totalMessages, tokenStats] = await Promise.all([
      prisma.conversation.count({ where: { siteId } }),
      prisma.message.count({
        where: { conversation: { siteId } },
      }),
      prisma.message.aggregate({
        where: { conversation: { siteId } },
        _sum: {
          tokensUsed: true,
          costInCents: true,
        },
      }),
    ]);

    return {
      totalConversations,
      totalMessages,
      totalTokensUsed: tokenStats._sum.tokensUsed || 0,
      totalCostCents: tokenStats._sum.costInCents || 0,
    };
  }
}

export const adminConversationService = new AdminConversationService();
