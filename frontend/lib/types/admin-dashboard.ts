export interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byAuthProvider: { provider: string; count: number }[];
    activeLastWeek: number;
    activeLastMonth: number;
    adminCount: number;
  };
  sites: {
    total: number;
    byCrawlStatus: { status: string; count: number }[];
    failedCrawlsLast24h: number;
    totalUrlsIndexed: number;
    urlsPendingCrawl: number;
  };
  embeddings: {
    total: number;
    createdLast24h: number;
    urlsWithoutEmbeddings: number;
    averageChunksPerUrl: number;
  };
  files: {
    total: number;
    byStatus: { status: string; count: number }[];
    failedFiles: number;
    stuckFiles: number;
    totalStorageBytes: string;
  };
  conversations: {
    total: number;
    activeLast24h: number;
    totalMessages: number;
    messagesLast24h: number;
    avgMessagesPerConversation: number;
    totalTokensUsed: number;
    estimatedCostCents: number;
  };
  subscriptions: {
    total: number;
    byStatus: { status: string; count: number }[];
    byPlanType: { planType: string; count: number }[];
    expiringTrialsNext7Days: number;
  };
  security: {
    activeSessions: number;
    sessionsCreatedLast24h: number;
    expiredTokensNeedingCleanup: number;
    usersWithMultipleSessions: number;
  };
  billing: {
    totalTransactions: number;
    totalRevenue: number;
    revenueThisMonth: number;
    transactionsByStatus: { status: string; count: number }[];
  };
}

export interface AttentionItem {
  label: string;
  value: number;
  severity: "info" | "warning" | "error";
  link: string;
}

export interface QuickLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}
