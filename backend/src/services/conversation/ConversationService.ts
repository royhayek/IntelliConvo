/**
 * Conversation Service
 * Business logic for conversation and message management
 */

import { prisma } from "../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../middleware/errors";
import { AppError, ErrorCode } from "../../middleware/errors";
import {
  ConversationListResponse,
  ConversationDetailsDTO,
  ConversationAnalyticsResponse,
  MessageSearchResponse,
  ConversationQueryParams,
  MessageSearchQueryParams,
  ConversationWithSiteDTO,
  MessageDTO,
  ConversationTimeSeriesPoint,
  TopSiteStats,
  MessageSearchResult,
} from "../../dto/conversation.dto";
import { calculatePagination, calculateOffset, normalizePagination } from "../../utils/response";

/**
 * ConversationService class
 * Handles all conversation-related business logic
 */
export class ConversationService {
  /**
   * Get conversations with filtering and pagination
   * @param userId - User ID
   * @param query - Query parameters (page, limit, search, dates, siteId)
   * @returns Paginated conversation list
   */
  async getConversations(userId: string, query: ConversationQueryParams): Promise<ConversationListResponse> {
    const { page = 1, limit = 20, search, startDate, endDate, siteId } = query;

    // Normalize pagination
    const { page: normalizedPage, limit: normalizedLimit } = normalizePagination(page, limit, 100);
    const offset = calculateOffset(normalizedPage, normalizedLimit);

    // Build where clause (excludes test conversations)
    const where: any = {
      site: {
        userId,
      },
      isTest: false,
    };

    // Filter by specific site
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId },
      });

      if (!site) {
        throw new NotFoundError("Site", siteId);
      }

      where.siteId = siteId;
    }

    // Date filtering
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.startedAt.lte = end;
      }
    }

    // Message content search
    if (search) {
      where.messages = {
        some: {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
      };
    }

    // Get conversations with pagination
    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip: offset,
        take: normalizedLimit,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Map to DTOs
    const conversationDTOs: ConversationWithSiteDTO[] = conversations.map((conv) => ({
      id: conv.id,
      siteId: conv.siteId,
      sessionId: conv.sessionId,
      userIdentifier: conv.userIdentifier,
      userAgent: conv.userAgent,
      ipAddress: conv.ipAddress,
      startedAt: conv.startedAt.toISOString(),
      lastMessageAt: conv.lastMessageAt.toISOString(),
      messageCount: conv._count.messages,
      site: conv.site,
      // Human handoff fields
      status: conv.status,
      escalatedAt: conv.escalatedAt?.toISOString() ?? null,
      escalationReason: conv.escalationReason,
      assignedAgentId: conv.assignedAgentId,
      agentJoinedAt: conv.agentJoinedAt?.toISOString() ?? null,
      resolvedAt: conv.resolvedAt?.toISOString() ?? null,
      agentNotes: conv.agentNotes,
    }));

    return {
      conversations: conversationDTOs,
      pagination: calculatePagination(normalizedPage, normalizedLimit, totalCount),
    };
  }

  /**
   * Get conversation analytics
   * @param userId - User ID
   * @param siteId - Optional site filter
   * @param period - Time period (7d, 30d, 90d, 1y)
   * @returns Conversation analytics with time series data
   */
  async getAnalytics(userId: string, siteId?: string, period: string = "30d"): Promise<ConversationAnalyticsResponse> {
    // Calculate date range
    const endDate = new Date();
    const startDate = this.calculateStartDate(period);

    // Build base where clause (excludes test conversations)
    const baseWhere: any = {
      site: { userId },
      isTest: false,
      startedAt: { gte: startDate, lte: endDate },
    };

    // Verify site ownership if filtering by site
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId },
      });

      if (!site) {
        throw new NotFoundError("Site", siteId);
      }

      baseWhere.siteId = siteId;
    }

    // Get overview statistics
    const [conversationStats, messageStats, uniqueUsers] = await Promise.all([
      this.getConversationStats(baseWhere),
      this.getMessageStats(baseWhere),
      this.getUniqueUsersCount(baseWhere),
    ]);

    // Get time series data
    const timeSeriesData = await this.getTimeSeriesData(startDate, endDate, baseWhere);

    // Get top sites (if not filtering by specific site)
    const topSites = await this.getTopSites(userId, siteId, startDate, endDate);

    return {
      overview: {
        totalConversations: conversationStats._count.id,
        totalMessages: messageStats._count.id,
        averageMessagesPerConversation: conversationStats._avg.messageCount || 0,
        activeUsers: uniqueUsers.length,
      },
      timeSeriesData,
      topSites,
    };
  }

  /**
   * Search messages across conversations
   * @param userId - User ID
   * @param query - Search query parameters
   * @returns Search results with messages
   */
  async searchMessages(userId: string, query: MessageSearchQueryParams): Promise<MessageSearchResponse> {
    const { query: searchQuery, siteId, limit = 20 } = query;

    const limitNumber = Math.min(100, Math.max(1, limit));

    // Build where clause (excludes test conversations)
    const where: any = {
      content: {
        contains: searchQuery,
        mode: "insensitive",
      },
      conversation: {
        isTest: false,
        site: {
          userId,
        },
      },
    };

    // Filter by site
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId },
      });

      if (!site) {
        throw new NotFoundError("Site", siteId);
      }

      where.conversation.siteId = siteId;
    }

    // Get messages
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          conversation: {
            select: {
              id: true,
              sessionId: true,
              site: {
                select: {
                  id: true,
                  siteName: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limitNumber,
      }),
      prisma.message.count({ where }),
    ]);

    // Map to DTOs
    const messageResults: MessageSearchResult[] = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as "USER" | "ASSISTANT",
      timestamp: msg.timestamp.toISOString(),
      conversation: msg.conversation,
    }));

    return {
      messages: messageResults,
      total: totalCount,
    };
  }

  /**
   * Get conversation details with messages
   * @param conversationId - Conversation ID
   * @param userId - User ID (for authorization)
   * @returns Conversation details with all messages
   */
  async getConversationDetails(conversationId: string, userId: string): Promise<ConversationDetailsDTO> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            userId: true,
          },
        },
        messages: {
          orderBy: { timestamp: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            timestamp: true,
            tokensUsed: true,
            costInCents: true,
            agentId: true,
          },
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
      throw new NotFoundError("Conversation", conversationId);
    }

    // Verify user owns the site
    if (conversation.site.userId !== userId) {
      throw new AppError(403, ErrorCode.FORBIDDEN, "Access denied");
    }

    // Map to DTO
    const { userId: siteUserId, ...siteInfo } = conversation.site;

    const messageDTOs: MessageDTO[] = conversation.messages.map((msg) => ({
      id: msg.id,
      conversationId: conversation.id,
      role: msg.role as "USER" | "ASSISTANT" | "AGENT",
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      tokensUsed: msg.tokensUsed,
      costInCents: msg.costInCents,
      agentId: msg.agentId,
    }));

    return {
      id: conversation.id,
      siteId: conversation.siteId,
      sessionId: conversation.sessionId,
      userIdentifier: conversation.userIdentifier,
      userAgent: conversation.userAgent,
      ipAddress: conversation.ipAddress,
      startedAt: conversation.startedAt.toISOString(),
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      messageCount: conversation.messageCount,
      site: siteInfo,
      messages: messageDTOs,
      // Human handoff fields
      status: conversation.status,
      escalatedAt: conversation.escalatedAt?.toISOString() ?? null,
      escalationReason: conversation.escalationReason,
      assignedAgentId: conversation.assignedAgentId,
      agentJoinedAt: conversation.agentJoinedAt?.toISOString() ?? null,
      resolvedAt: conversation.resolvedAt?.toISOString() ?? null,
      agentNotes: conversation.agentNotes,
      assignedAgent: conversation.assignedAgent,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Calculate start date based on period
   */
  private calculateStartDate(period: string): Date {
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return startDate;
  }

  /**
   * Get conversation statistics
   */
  private async getConversationStats(where: any) {
    return await prisma.conversation.aggregate({
      where,
      _count: { id: true },
      _avg: { messageCount: true },
    });
  }

  /**
   * Get message statistics
   */
  private async getMessageStats(where: any) {
    return await prisma.message.aggregate({
      where: {
        conversation: where,
      },
      _count: { id: true },
    });
  }

  /**
   * Get unique users count
   */
  private async getUniqueUsersCount(where: any) {
    return await prisma.conversation.findMany({
      where: {
        ...where,
        userIdentifier: { not: null },
      },
      select: { userIdentifier: true },
      distinct: ["userIdentifier"],
    });
  }

  /**
   * Get time series data (daily breakdown)
   * Counts conversations by start date and messages by their actual timestamp
   */
  private async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    baseWhere: any
  ): Promise<ConversationTimeSeriesPoint[]> {
    const timeSeriesData: ConversationTimeSeriesPoint[] = [];
    const currentDate = new Date(startDate);
    // Reset to start of day
    currentDate.setHours(0, 0, 0, 0);

    // Extract site/user filters without the date filter for message counting
    const { startedAt, ...baseWhereWithoutDate } = baseWhere;

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [dailyConversations, dailyMessages] = await Promise.all([
        // Count conversations that started on this day
        prisma.conversation.count({
          where: {
            ...baseWhereWithoutDate,
            startedAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        // Count messages sent on this day (by message timestamp, not conversation start)
        prisma.message.count({
          where: {
            timestamp: { gte: dayStart, lte: dayEnd },
            conversation: baseWhereWithoutDate,
          },
        }),
      ]);

      timeSeriesData.push({
        date: dayStart.toISOString().split("T")[0],
        conversations: dailyConversations,
        messages: dailyMessages,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return timeSeriesData;
  }

  /**
   * Get top sites by conversation count
   */
  private async getTopSites(
    userId: string,
    siteId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TopSiteStats[]> {
    // If filtering by specific site, return empty array
    if (siteId) {
      return [];
    }

    // Get all sites with conversation counts (excludes test conversations)
    const sitesWithStats = await prisma.site.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            conversations: {
              where: {
                isTest: false,
                startedAt: { gte: startDate, lte: endDate },
              },
            },
          },
        },
        conversations: {
          where: {
            isTest: false,
            startedAt: { gte: startDate, lte: endDate },
          },
          include: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    // Calculate message counts and map to DTOs
    const topSites: TopSiteStats[] = sitesWithStats.map((site) => {
      const messageCount = site.conversations.reduce((sum, conv) => sum + conv._count.messages, 0);

      return {
        siteId: site.id,
        siteName: site.siteName,
        conversationCount: site._count.conversations,
        messageCount,
      };
    });

    // Sort by conversation count and return top 5
    topSites.sort((a, b) => b.conversationCount - a.conversationCount);
    return topSites.slice(0, 5);
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
