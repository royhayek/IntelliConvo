import { prisma } from '../../lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Filter to exclude admin users from customer-facing metrics
const NON_ADMIN_USER_FILTER = { isAdmin: false };

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
      // Exclude admin users from customer counts
      prisma.user.count({ where: NON_ADMIN_USER_FILTER }),
      prisma.user.count({
        where: { ...NON_ADMIN_USER_FILTER, createdAt: { gte: todayStart } },
      }),
      prisma.user.count({
        where: { ...NON_ADMIN_USER_FILTER, createdAt: { gte: weekAgo } },
      }),
      prisma.user.count({
        where: { ...NON_ADMIN_USER_FILTER, createdAt: { gte: monthAgo } },
      }),
      prisma.user.groupBy({
        by: ['authProvider'],
        where: NON_ADMIN_USER_FILTER,
        _count: { id: true },
      }),
      prisma.user.count({
        where: { ...NON_ADMIN_USER_FILTER, lastLoginAt: { gte: weekAgo } },
      }),
      prisma.user.count({
        where: { ...NON_ADMIN_USER_FILTER, lastLoginAt: { gte: monthAgo } },
      }),
      // Admin count is intentionally kept to show how many admins exist
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

    // Filter to exclude sites owned by admin users
    const nonAdminSiteFilter = { user: NON_ADMIN_USER_FILTER };

    const [total, byCrawlStatus, failedCrawlsLast24h, totalUrlsIndexed, urlsPendingCrawl] =
      await Promise.all([
        prisma.site.count({ where: nonAdminSiteFilter }),
        prisma.site.groupBy({
          by: ['crawlStatus'],
          where: nonAdminSiteFilter,
          _count: { id: true },
        }),
        prisma.site.count({
          where: {
            ...nonAdminSiteFilter,
            crawlStatus: 'FAILED',
            updatedAt: { gte: dayAgo },
          },
        }),
        prisma.siteUrl.count({
          where: {
            isActive: true,
            isExcluded: false,
            site: nonAdminSiteFilter,
          },
        }),
        prisma.siteUrl.count({
          where: {
            lastCrawledAt: null,
            site: nonAdminSiteFilter,
          },
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

    // Filter to exclude embeddings from admin-owned sites
    const nonAdminSiteFilter = { user: NON_ADMIN_USER_FILTER };
    const nonAdminUrlFilter = { site: nonAdminSiteFilter };

    const [total, createdLast24h, urlsWithEmbeddings, totalUrls, embeddingCounts] =
      await Promise.all([
        prisma.embedding.count({
          where: { siteUrl: nonAdminUrlFilter },
        }),
        prisma.embedding.count({
          where: {
            createdAt: { gte: dayAgo },
            siteUrl: nonAdminUrlFilter,
          },
        }),
        prisma.siteUrl.count({
          where: {
            ...nonAdminUrlFilter,
            embeddings: { some: {} },
          },
        }),
        prisma.siteUrl.count({
          where: {
            isActive: true,
            isExcluded: false,
            ...nonAdminUrlFilter,
          },
        }),
        prisma.embedding.groupBy({
          by: ['siteUrlId'],
          where: { siteUrl: nonAdminUrlFilter },
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

    // Filter to exclude files from admin-owned sites
    const nonAdminSiteFilter = { user: NON_ADMIN_USER_FILTER };
    const nonAdminFileFilter = { site: nonAdminSiteFilter };

    const [total, byStatus, failedFiles, stuckFiles, totalStorage] = await Promise.all([
      prisma.knowledgeFile.count({ where: nonAdminFileFilter }),
      prisma.knowledgeFile.groupBy({
        by: ['status'],
        where: nonAdminFileFilter,
        _count: { id: true },
      }),
      prisma.knowledgeFile.count({
        where: { ...nonAdminFileFilter, status: 'FAILED' },
      }),
      prisma.knowledgeFile.count({
        where: {
          ...nonAdminFileFilter,
          status: 'PENDING',
          uploadedAt: { lt: tenMinutesAgo },
        },
      }),
      prisma.knowledgeFile.aggregate({
        where: nonAdminFileFilter,
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

    // Filter to exclude conversations from admin-owned sites
    const nonAdminSiteFilter = { user: NON_ADMIN_USER_FILTER };
    const nonAdminConversationFilter = { site: nonAdminSiteFilter };
    const nonAdminMessageFilter = { conversation: nonAdminConversationFilter };

    const [total, activeLast24h, totalMessages, messagesLast24h, messageStats] = await Promise.all([
      prisma.conversation.count({ where: nonAdminConversationFilter }),
      prisma.conversation.count({
        where: { ...nonAdminConversationFilter, lastMessageAt: { gte: dayAgo } },
      }),
      prisma.message.count({ where: nonAdminMessageFilter }),
      prisma.message.count({
        where: { ...nonAdminMessageFilter, timestamp: { gte: dayAgo } },
      }),
      prisma.message.aggregate({
        where: nonAdminMessageFilter,
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

    // Filter to exclude subscriptions for admin users
    const nonAdminSubscriptionFilter = { user: NON_ADMIN_USER_FILTER };

    const [total, byStatus, byPlanType, expiringTrialsNext7Days] = await Promise.all([
      prisma.subscription.count({ where: nonAdminSubscriptionFilter }),
      prisma.subscription.groupBy({
        by: ['status'],
        where: nonAdminSubscriptionFilter,
        _count: { id: true },
      }),
      prisma.subscription.groupBy({
        by: ['planType'],
        where: nonAdminSubscriptionFilter,
        _count: { id: true },
      }),
      prisma.subscription.count({
        where: {
          ...nonAdminSubscriptionFilter,
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

    // Get admin user IDs to exclude from session stats
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });
    const adminUserIds = adminUsers.map((u) => u.id);

    // Filter to exclude admin user sessions
    const nonAdminSessionFilter = { userId: { notIn: adminUserIds } };

    const [activeSessions, sessionsCreatedLast24h, expiredTokensNeedingCleanup, sessionsByUser] =
      await Promise.all([
        prisma.refreshToken.count({
          where: { ...nonAdminSessionFilter, expiresAt: { gt: now } },
        }),
        prisma.refreshToken.count({
          where: { ...nonAdminSessionFilter, createdAt: { gte: dayAgo } },
        }),
        prisma.refreshToken.count({
          where: { ...nonAdminSessionFilter, expiresAt: { lt: now } },
        }),
        prisma.refreshToken.groupBy({
          by: ['userId'],
          _count: { id: true },
          where: { ...nonAdminSessionFilter, expiresAt: { gt: now } },
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

    // Filter to exclude transactions for admin users
    const nonAdminTransactionFilter = { user: NON_ADMIN_USER_FILTER };

    const [totalTransactions, totalRevenue, revenueThisMonth, transactionsByStatus] =
      await Promise.all([
        prisma.billingTransaction.count({ where: nonAdminTransactionFilter }),
        prisma.billingTransaction.aggregate({
          where: { ...nonAdminTransactionFilter, status: 'paid' },
          _sum: { amount: true },
        }),
        prisma.billingTransaction.aggregate({
          where: {
            ...nonAdminTransactionFilter,
            status: 'paid',
            createdAt: { gte: monthStart },
          },
          _sum: { amount: true },
        }),
        prisma.billingTransaction.groupBy({
          by: ['status'],
          where: nonAdminTransactionFilter,
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
