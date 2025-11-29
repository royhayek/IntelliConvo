/**
 * Site Analytics Service
 * Provides comprehensive analytics for individual sites
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';

// Types
export interface SiteAnalyticsResponse {
  overview: {
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    activeUsers: number;
    totalTokensUsed: number;
    totalCostInCents: number;
  };
  knowledgeBase: {
    totalUrls: number;
    urlsByStatus: {
      ready: number;
      processing: number;
      pending: number;
      failed: number;
      excluded: number;
    };
    totalEmbeddings: number;
    totalFiles: number;
    filesByStatus: {
      completed: number;
      pending: number;
      failed: number;
    };
    totalFileSizeBytes: number;
  };
  engagement: {
    conversationsToday: number;
    conversationsThisWeek: number;
    conversationsThisMonth: number;
    messagesPerDay: Array<{ date: string; messages: number }>;
    conversationsPerDay: Array<{ date: string; conversations: number }>;
    peakHours: Array<{ hour: number; count: number }>;
  };
  responseMetrics: {
    averageTokensPerResponse: number;
    averageCostPerConversation: number;
    totalAssistantMessages: number;
    totalUserMessages: number;
  };
  timeSeriesData: Array<{
    date: string;
    conversations: number;
    messages: number;
    tokens: number;
    cost: number;
  }>;
}

export class SiteAnalyticsService {
  /**
   * Get comprehensive analytics for a site
   */
  async getAnalytics(
    siteId: string,
    userId: string,
    period: string = '30d'
  ): Promise<SiteAnalyticsResponse> {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    const endDate = new Date();
    const startDate = this.calculateStartDate(period);

    // Run all queries in parallel for performance
    const [
      overview,
      knowledgeBase,
      engagement,
      responseMetrics,
      timeSeriesData,
    ] = await Promise.all([
      this.getOverviewStats(siteId, startDate, endDate),
      this.getKnowledgeBaseStats(siteId),
      this.getEngagementStats(siteId, startDate, endDate),
      this.getResponseMetrics(siteId, startDate, endDate),
      this.getTimeSeriesData(siteId, startDate, endDate),
    ]);

    return {
      overview,
      knowledgeBase,
      engagement,
      responseMetrics,
      timeSeriesData,
    };
  }

  /**
   * Calculate start date based on period
   */
  private calculateStartDate(period: string): Date {
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return startDate;
  }

  /**
   * Get overview statistics (excludes test conversations)
   */
  private async getOverviewStats(siteId: string, startDate: Date, endDate: Date) {
    const [conversationStats, messageStats, uniqueUsers, tokenStats] = await Promise.all([
      // Conversation count and average
      prisma.conversation.aggregate({
        where: {
          siteId,
          isTest: false,
          startedAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
        _avg: { messageCount: true },
      }),
      // Message count
      prisma.message.count({
        where: {
          conversation: {
            siteId,
            isTest: false,
            startedAt: { gte: startDate, lte: endDate },
          },
        },
      }),
      // Unique sessions (visitors)
      prisma.conversation.findMany({
        where: {
          siteId,
          isTest: false,
          startedAt: { gte: startDate, lte: endDate },
        },
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),
      // Token and cost aggregates
      prisma.message.aggregate({
        where: {
          conversation: {
            siteId,
            isTest: false,
            startedAt: { gte: startDate, lte: endDate },
          },
          role: 'ASSISTANT',
        },
        _sum: {
          tokensUsed: true,
          costInCents: true,
        },
      }),
    ]);

    return {
      totalConversations: conversationStats._count.id,
      totalMessages: messageStats,
      averageMessagesPerConversation: conversationStats._avg.messageCount || 0,
      activeUsers: uniqueUsers.length,
      totalTokensUsed: tokenStats._sum.tokensUsed || 0,
      totalCostInCents: tokenStats._sum.costInCents || 0,
    };
  }

  /**
   * Get knowledge base statistics
   */
  private async getKnowledgeBaseStats(siteId: string) {
    const [urlStats, embeddingCount, fileStats] = await Promise.all([
      // URL status breakdown
      prisma.siteUrl.groupBy({
        by: ['embeddingStatus'],
        where: { siteId },
        _count: { id: true },
      }),
      // Total embeddings
      prisma.embedding.count({
        where: {
          siteUrl: { siteId },
        },
      }),
      // File status breakdown
      prisma.knowledgeFile.groupBy({
        by: ['status'],
        where: { siteId },
        _count: { id: true },
        _sum: { fileSize: true },
      }),
    ]);

    // Process URL stats
    const urlsByStatus = {
      ready: 0,
      processing: 0,
      pending: 0,
      failed: 0,
      excluded: 0,
    };

    let totalUrls = 0;
    for (const stat of urlStats) {
      const count = stat._count.id;
      totalUrls += count;
      switch (stat.embeddingStatus) {
        case 'READY':
          urlsByStatus.ready = count;
          break;
        case 'PROCESSING':
        case 'SCRAPING':
        case 'SCRAPED':
          urlsByStatus.processing += count;
          break;
        case 'PENDING':
          urlsByStatus.pending = count;
          break;
        case 'FAILED':
          urlsByStatus.failed = count;
          break;
        case 'EXCLUDED':
          urlsByStatus.excluded = count;
          break;
      }
    }

    // Process file stats
    const filesByStatus = {
      completed: 0,
      pending: 0,
      failed: 0,
    };
    let totalFiles = 0;
    let totalFileSizeBytes = BigInt(0);

    for (const stat of fileStats) {
      const count = stat._count.id;
      totalFiles += count;
      if (stat._sum.fileSize) {
        totalFileSizeBytes += stat._sum.fileSize;
      }
      switch (stat.status) {
        case 'COMPLETED':
          filesByStatus.completed = count;
          break;
        case 'PENDING':
          filesByStatus.pending = count;
          break;
        case 'FAILED':
          filesByStatus.failed = count;
          break;
      }
    }

    return {
      totalUrls,
      urlsByStatus,
      totalEmbeddings: embeddingCount,
      totalFiles,
      filesByStatus,
      totalFileSizeBytes: Number(totalFileSizeBytes),
    };
  }

  /**
   * Get engagement statistics (excludes test conversations)
   */
  private async getEngagementStats(siteId: string, startDate: Date, endDate: Date) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    const [conversationsToday, conversationsThisWeek, conversationsThisMonth, peakHoursData] =
      await Promise.all([
        prisma.conversation.count({
          where: { siteId, isTest: false, startedAt: { gte: todayStart } },
        }),
        prisma.conversation.count({
          where: { siteId, isTest: false, startedAt: { gte: weekStart } },
        }),
        prisma.conversation.count({
          where: { siteId, isTest: false, startedAt: { gte: monthStart } },
        }),
        // Peak hours analysis
        prisma.conversation.findMany({
          where: { siteId, isTest: false, startedAt: { gte: startDate, lte: endDate } },
          select: { startedAt: true },
        }),
      ]);

    // Calculate peak hours
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;

    for (const conv of peakHoursData) {
      const hour = conv.startedAt.getHours();
      hourCounts[hour]++;
    }

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    // Get daily data for messages and conversations
    const [messagesPerDay, conversationsPerDay] = await Promise.all([
      this.getDailyMessageCounts(siteId, startDate, endDate),
      this.getDailyConversationCounts(siteId, startDate, endDate),
    ]);

    return {
      conversationsToday,
      conversationsThisWeek,
      conversationsThisMonth,
      messagesPerDay,
      conversationsPerDay,
      peakHours,
    };
  }

  /**
   * Get response metrics (excludes test conversations)
   */
  private async getResponseMetrics(siteId: string, startDate: Date, endDate: Date) {
    const [assistantStats, userMessages, conversationCount] = await Promise.all([
      prisma.message.aggregate({
        where: {
          conversation: {
            siteId,
            isTest: false,
            startedAt: { gte: startDate, lte: endDate },
          },
          role: 'ASSISTANT',
        },
        _count: { id: true },
        _avg: { tokensUsed: true },
        _sum: { costInCents: true },
      }),
      prisma.message.count({
        where: {
          conversation: {
            siteId,
            isTest: false,
            startedAt: { gte: startDate, lte: endDate },
          },
          role: 'USER',
        },
      }),
      prisma.conversation.count({
        where: {
          siteId,
          isTest: false,
          startedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return {
      averageTokensPerResponse: assistantStats._avg.tokensUsed || 0,
      averageCostPerConversation:
        conversationCount > 0
          ? (assistantStats._sum.costInCents || 0) / conversationCount
          : 0,
      totalAssistantMessages: assistantStats._count.id,
      totalUserMessages: userMessages,
    };
  }

  /**
   * Get time series data for charts (excludes test conversations)
   */
  private async getTimeSeriesData(siteId: string, startDate: Date, endDate: Date) {
    const timeSeriesData: Array<{
      date: string;
      conversations: number;
      messages: number;
      tokens: number;
      cost: number;
    }> = [];

    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [conversations, messageData] = await Promise.all([
        prisma.conversation.count({
          where: {
            siteId,
            isTest: false,
            startedAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        prisma.message.aggregate({
          where: {
            timestamp: { gte: dayStart, lte: dayEnd },
            conversation: { siteId, isTest: false },
          },
          _count: { id: true },
          _sum: {
            tokensUsed: true,
            costInCents: true,
          },
        }),
      ]);

      timeSeriesData.push({
        date: dayStart.toISOString().split('T')[0],
        conversations,
        messages: messageData._count.id,
        tokens: messageData._sum.tokensUsed || 0,
        cost: messageData._sum.costInCents || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return timeSeriesData;
  }

  /**
   * Get daily message counts (excludes test conversations)
   */
  private async getDailyMessageCounts(siteId: string, startDate: Date, endDate: Date) {
    const result: Array<{ date: string; messages: number }> = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.message.count({
        where: {
          timestamp: { gte: dayStart, lte: dayEnd },
          conversation: { siteId, isTest: false },
        },
      });

      result.push({
        date: dayStart.toISOString().split('T')[0],
        messages: count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Get daily conversation counts (excludes test conversations)
   */
  private async getDailyConversationCounts(siteId: string, startDate: Date, endDate: Date) {
    const result: Array<{ date: string; conversations: number }> = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.conversation.count({
        where: {
          siteId,
          isTest: false,
          startedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      result.push({
        date: dayStart.toISOString().split('T')[0],
        conversations: count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
}

// Export singleton instance
export const siteAnalyticsService = new SiteAnalyticsService();
