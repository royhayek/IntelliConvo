import { prisma } from '../../lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface UserStats {
  total: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byAuthProvider: {
    provider: string;
    count: number;
  }[];
  activeLastWeek: number;
  activeLastMonth: number;
  adminCount: number;
}

interface SiteStats {
  total: number;
  byCrawlStatus: {
    status: string;
    count: number;
  }[];
  failedCrawlsLast24h: number;
  totalUrlsIndexed: number;
  urlsPendingCrawl: number;
}

interface EmbeddingStats {
  total: number;
  createdLast24h: number;
  urlsWithoutEmbeddings: number;
  averageChunksPerUrl: number;
}

interface FileStats {
  total: number;
  byStatus: {
    status: string;
    count: number;
  }[];
  failedFiles: number;
  stuckFiles: number;
  totalStorageBytes: string;
}

interface ConversationStats {
  total: number;
  activeLast24h: number;
  totalMessages: number;
  messagesLast24h: number;
  avgMessagesPerConversation: number;
  totalTokensUsed: number;
  estimatedCostCents: number;
}

interface SubscriptionStats {
  total: number;
  byStatus: {
    status: string;
    count: number;
  }[];
  byPlanType: {
    planType: string;
    count: number;
  }[];
  expiringTrialsNext7Days: number;
}

interface SecurityStats {
  activeSessions: number;
  sessionsCreatedLast24h: number;
  expiredTokensNeedingCleanup: number;
  usersWithMultipleSessions: number;
}

interface BillingStats {
  totalTransactions: number;
  totalRevenue: number;
  revenueThisMonth: number;
  transactionsByStatus: {
    status: string;
    count: number;
  }[];
}

export interface DashboardStats {
  users: UserStats;
  sites: SiteStats;
  embeddings: EmbeddingStats;
  files: FileStats;
  conversations: ConversationStats;
  subscriptions: SubscriptionStats;
  security: SecurityStats;
  billing: BillingStats;
}

class AdminStatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [users, sites, embeddings, files, conversations, subscriptions, security, billing] =
      await Promise.all([
        this.getUserStats(),
        this.getSiteStats(),
        this.getEmbeddingStats(),
        this.getFileStats(),
        this.getConversationStats(),
        this.getSubscriptionStats(),
        this.getSecurityStats(),
        this.getBillingStats(),
      ]);

    return {
      users,
      sites,
      embeddings,
      files,
      conversations,
      subscriptions,
      security,
      billing,
    };
  }

  async getUserStats(): Promise<UserStats> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    const [
      total,
      newToday,
      newThisWeek,
      newThisMonth,
      byAuthProvider,
      activeLastWeek,
      activeLastMonth,
      adminCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      prisma.user.groupBy({
        by: ['authProvider'],
        _count: { id: true },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: weekAgo } },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: monthAgo } },
      }),
      prisma.user.count({
        where: { isAdmin: true },
      }),
    ]);

    return {
      total,
      newToday,
      newThisWeek,
      newThisMonth,
      byAuthProvider: byAuthProvider.map((p) => ({
        provider: p.authProvider,
        count: p._count.id,
      })),
      activeLastWeek,
      activeLastMonth,
      adminCount,
    };
  }

  async getSiteStats(): Promise<SiteStats> {
    const now = new Date();
    const dayAgo = subDays(now, 1);

    const [total, byCrawlStatus, failedCrawlsLast24h, totalUrlsIndexed, urlsPendingCrawl] =
      await Promise.all([
        prisma.site.count(),
        prisma.site.groupBy({
          by: ['crawlStatus'],
          _count: { id: true },
        }),
        prisma.site.count({
          where: {
            crawlStatus: 'FAILED',
            updatedAt: { gte: dayAgo },
          },
        }),
        prisma.siteUrl.count({
          where: { isActive: true, isExcluded: false },
        }),
        prisma.siteUrl.count({
          where: { lastCrawledAt: null },
        }),
      ]);

    return {
      total,
      byCrawlStatus: byCrawlStatus.map((s) => ({
        status: s.crawlStatus,
        count: s._count.id,
      })),
      failedCrawlsLast24h,
      totalUrlsIndexed,
      urlsPendingCrawl,
    };
  }

  async getEmbeddingStats(): Promise<EmbeddingStats> {
    const now = new Date();
    const dayAgo = subDays(now, 1);

    const [total, createdLast24h, urlsWithEmbeddings, totalUrls, embeddingCounts] =
      await Promise.all([
        prisma.embedding.count(),
        prisma.embedding.count({
          where: { createdAt: { gte: dayAgo } },
        }),
        prisma.siteUrl.count({
          where: {
            embeddings: { some: {} },
          },
        }),
        prisma.siteUrl.count({
          where: { isActive: true, isExcluded: false },
        }),
        prisma.embedding.groupBy({
          by: ['siteUrlId'],
          _count: { id: true },
        }),
      ]);

    const urlsWithoutEmbeddings = totalUrls - urlsWithEmbeddings;
    const averageChunksPerUrl =
      urlsWithEmbeddings > 0
        ? embeddingCounts.reduce((sum, e) => sum + e._count.id, 0) / urlsWithEmbeddings
        : 0;

    return {
      total,
      createdLast24h,
      urlsWithoutEmbeddings,
      averageChunksPerUrl: Math.round(averageChunksPerUrl * 100) / 100,
    };
  }

  async getFileStats(): Promise<FileStats> {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const [total, byStatus, failedFiles, stuckFiles, totalStorage] = await Promise.all([
      prisma.knowledgeFile.count(),
      prisma.knowledgeFile.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.knowledgeFile.count({
        where: { status: 'FAILED' },
      }),
      prisma.knowledgeFile.count({
        where: {
          status: 'PENDING',
          uploadedAt: { lt: tenMinutesAgo },
        },
      }),
      prisma.knowledgeFile.aggregate({
        _sum: { fileSize: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      failedFiles,
      stuckFiles,
      totalStorageBytes: (totalStorage._sum.fileSize || BigInt(0)).toString(),
    };
  }

  async getConversationStats(): Promise<ConversationStats> {
    const now = new Date();
    const dayAgo = subDays(now, 1);

    const [total, activeLast24h, totalMessages, messagesLast24h, messageStats] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({
        where: { lastMessageAt: { gte: dayAgo } },
      }),
      prisma.message.count(),
      prisma.message.count({
        where: { timestamp: { gte: dayAgo } },
      }),
      prisma.message.aggregate({
        _sum: {
          tokensUsed: true,
          costInCents: true,
        },
      }),
    ]);

    const avgMessagesPerConversation = total > 0 ? totalMessages / total : 0;

    return {
      total,
      activeLast24h,
      totalMessages,
      messagesLast24h,
      avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 100) / 100,
      totalTokensUsed: messageStats._sum.tokensUsed || 0,
      estimatedCostCents: messageStats._sum.costInCents || 0,
    };
  }

  async getSubscriptionStats(): Promise<SubscriptionStats> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, byStatus, byPlanType, expiringTrialsNext7Days] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.subscription.groupBy({
        by: ['planType'],
        _count: { id: true },
      }),
      prisma.subscription.count({
        where: {
          status: 'TRIAL',
          trialEndsAt: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      byPlanType: byPlanType.map((p) => ({
        planType: p.planType,
        count: p._count.id,
      })),
      expiringTrialsNext7Days,
    };
  }

  async getSecurityStats(): Promise<SecurityStats> {
    const now = new Date();
    const dayAgo = subDays(now, 1);

    const [activeSessions, sessionsCreatedLast24h, expiredTokensNeedingCleanup, sessionsByUser] =
      await Promise.all([
        prisma.refreshToken.count({
          where: { expiresAt: { gt: now } },
        }),
        prisma.refreshToken.count({
          where: { createdAt: { gte: dayAgo } },
        }),
        prisma.refreshToken.count({
          where: { expiresAt: { lt: now } },
        }),
        prisma.refreshToken.groupBy({
          by: ['userId'],
          _count: { id: true },
          where: { expiresAt: { gt: now } },
        }),
      ]);

    const usersWithMultipleSessions = sessionsByUser.filter((s) => s._count.id > 1).length;

    return {
      activeSessions,
      sessionsCreatedLast24h,
      expiredTokensNeedingCleanup,
      usersWithMultipleSessions,
    };
  }

  async getBillingStats(): Promise<BillingStats> {
    const now = new Date();
    const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));

    const [totalTransactions, totalRevenue, revenueThisMonth, transactionsByStatus] =
      await Promise.all([
        prisma.billingTransaction.count(),
        prisma.billingTransaction.aggregate({
          _sum: { amount: true },
          where: { status: 'paid' },
        }),
        prisma.billingTransaction.aggregate({
          _sum: { amount: true },
          where: {
            status: 'paid',
            createdAt: { gte: monthStart },
          },
        }),
        prisma.billingTransaction.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

    return {
      totalTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueThisMonth: revenueThisMonth._sum.amount || 0,
      transactionsByStatus: transactionsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }
}

export const adminStatsService = new AdminStatsService();
