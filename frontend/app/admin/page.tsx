"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Globe,
  MessageSquare,
  CreditCard,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowRight,
  Brain,
  FileText,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAdminSocket } from "@/lib/hooks/useAdminSocket";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import {
  useGetApiV1AdminStatsUsers,
  useGetApiV1AdminStatsSites,
  useGetApiV1AdminStatsEmbeddings,
  useGetApiV1AdminStatsFiles,
  useGetApiV1AdminStatsConversations,
  useGetApiV1AdminStatsSubscriptions,
  useGetApiV1AdminStatsSecurity,
  useGetApiV1AdminStatsBilling,
} from "@/lib/api/generated/queries/admin/admin";

interface DashboardStats {
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

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AdminDashboard() {
  // Local state for WebSocket updates and refreshing state
  const [wsStats, setWsStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle real-time stats updates from WebSocket
  const handleStatsUpdate = useCallback((newStats: DashboardStats) => {
    setWsStats(newStats);
    setIsRefreshing(false);
  }, []);

  // WebSocket connection for real-time updates
  const { isConnected, lastUpdate, requestRefresh } = useAdminSocket({
    onStatsUpdate: handleStatsUpdate,
    autoConnect: true,
  });

  // Use generated Orval hooks for fetching stats
  // Disable queries when WebSocket has provided data
  const hasWsData = wsStats !== null;

  const usersQuery = useGetApiV1AdminStatsUsers({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const sitesQuery = useGetApiV1AdminStatsSites({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const embeddingsQuery = useGetApiV1AdminStatsEmbeddings({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const filesQuery = useGetApiV1AdminStatsFiles({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const conversationsQuery = useGetApiV1AdminStatsConversations({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const subscriptionsQuery = useGetApiV1AdminStatsSubscriptions({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const securityQuery = useGetApiV1AdminStatsSecurity({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const billingQuery = useGetApiV1AdminStatsBilling({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });

  // Combine loading states from all queries
  const isLoading = !hasWsData && (
    usersQuery.isLoading ||
    sitesQuery.isLoading ||
    embeddingsQuery.isLoading ||
    filesQuery.isLoading ||
    conversationsQuery.isLoading ||
    subscriptionsQuery.isLoading ||
    securityQuery.isLoading ||
    billingQuery.isLoading
  );

  // Combine error states from all queries
  const queryError = usersQuery.error ||
    sitesQuery.error ||
    embeddingsQuery.error ||
    filesQuery.error ||
    conversationsQuery.error ||
    subscriptionsQuery.error ||
    securityQuery.error ||
    billingQuery.error;

  // Combine data from all queries into DashboardStats format
  // WebSocket data takes priority over query data
  const stats = useMemo<DashboardStats | null>(() => {
    // If WebSocket has provided data, use it
    if (wsStats) {
      return wsStats;
    }

    // Otherwise, combine data from individual queries
    const usersData = usersQuery.data?.data as DashboardStats['users'] | undefined;
    const sitesData = sitesQuery.data?.data as DashboardStats['sites'] | undefined;
    const embeddingsData = embeddingsQuery.data?.data as DashboardStats['embeddings'] | undefined;
    const filesData = filesQuery.data?.data as DashboardStats['files'] | undefined;
    const conversationsData = conversationsQuery.data?.data as DashboardStats['conversations'] | undefined;
    const subscriptionsData = subscriptionsQuery.data?.data as DashboardStats['subscriptions'] | undefined;
    const securityData = securityQuery.data?.data as DashboardStats['security'] | undefined;
    const billingData = billingQuery.data?.data as DashboardStats['billing'] | undefined;

    // Only return combined stats if all data is available
    if (
      usersData &&
      sitesData &&
      embeddingsData &&
      filesData &&
      conversationsData &&
      subscriptionsData &&
      securityData &&
      billingData
    ) {
      return {
        users: usersData,
        sites: sitesData,
        embeddings: embeddingsData,
        files: filesData,
        conversations: conversationsData,
        subscriptions: subscriptionsData,
        security: securityData,
        billing: billingData,
      };
    }

    return null;
  }, [
    wsStats,
    usersQuery.data,
    sitesQuery.data,
    embeddingsQuery.data,
    filesQuery.data,
    conversationsQuery.data,
    subscriptionsQuery.data,
    securityQuery.data,
    billingQuery.data,
  ]);

  // Manual refresh handler - refetch all queries
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Try WebSocket refresh first
    requestRefresh();
    // Also refetch queries as fallback
    if (!hasWsData) {
      Promise.all([
        usersQuery.refetch(),
        sitesQuery.refetch(),
        embeddingsQuery.refetch(),
        filesQuery.refetch(),
        conversationsQuery.refetch(),
        subscriptionsQuery.refetch(),
        securityQuery.refetch(),
        billingQuery.refetch(),
      ]).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [
    requestRefresh,
    hasWsData,
    usersQuery,
    sitesQuery,
    embeddingsQuery,
    filesQuery,
    conversationsQuery,
    subscriptionsQuery,
    securityQuery,
    billingQuery,
  ]);

  // Reset refreshing state when queries complete (fallback for when WebSocket doesn't respond)
  useEffect(() => {
    if (isRefreshing && !isLoading && stats) {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isLoading, stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (queryError && !stats) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {queryError instanceof Error ? queryError.message : "Failed to fetch dashboard statistics"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  // Find attention-needed items
  const attentionItems = [];
  if (stats.embeddings.urlsWithoutEmbeddings > 0) {
    attentionItems.push({
      label: "URLs without embeddings",
      value: stats.embeddings.urlsWithoutEmbeddings,
      severity: "warning",
      link: "/admin/urls",
    });
  }
  if (stats.files.failedFiles > 0) {
    attentionItems.push({
      label: "Failed file uploads",
      value: stats.files.failedFiles,
      severity: "error",
      link: "/admin/files",
    });
  }
  if (stats.files.stuckFiles > 0) {
    attentionItems.push({
      label: "Stuck file processing",
      value: stats.files.stuckFiles,
      severity: "warning",
      link: "/admin/files",
    });
  }
  if (stats.sites.failedCrawlsLast24h > 0) {
    attentionItems.push({
      label: "Failed crawls (24h)",
      value: stats.sites.failedCrawlsLast24h,
      severity: "error",
      link: "/admin/sites",
    });
  }
  if (stats.subscriptions.expiringTrialsNext7Days > 0) {
    attentionItems.push({
      label: "Trials expiring (7 days)",
      value: stats.subscriptions.expiringTrialsNext7Days,
      severity: "info",
      link: "/admin/subscriptions",
    });
  }
  if (stats.security.expiredTokensNeedingCleanup > 100) {
    attentionItems.push({
      label: "Expired tokens to cleanup",
      value: stats.security.expiredTokensNeedingCleanup,
      severity: "warning",
      link: "/admin/sessions",
    });
  }

  // Prepare chart data
  const subscriptionStatusData = stats.subscriptions.byStatus.map((item, index) => ({
    name: item.status,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const crawlStatusData = stats.sites.byCrawlStatus.map((item, index) => ({
    name: item.status,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const authProviderData = stats.users.byAuthProvider.map((item, index) => ({
    name: item.provider,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Growth comparison data
  const growthData = [
    { period: "Today", users: stats.users.newToday, conversations: stats.conversations.activeLast24h },
    { period: "This Week", users: stats.users.newThisWeek, conversations: Math.round(stats.conversations.activeLast24h * 3) },
    { period: "This Month", users: stats.users.newThisMonth, conversations: stats.conversations.total > 0 ? Math.round(stats.conversations.total * 0.4) : 0 },
  ];

  // Quick links
  const quickLinks = [
    { label: "Users", href: "/admin/users", icon: Users, count: stats.users.total },
    { label: "Sites", href: "/admin/sites", icon: Globe, count: stats.sites.total },
    { label: "Conversations", href: "/admin/conversations", icon: MessageSquare, count: stats.conversations.total },
    { label: "Embeddings", href: "/admin/embeddings", icon: Brain, count: stats.embeddings.total },
    { label: "Files", href: "/admin/files", icon: FileText, count: stats.files.total },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, count: stats.subscriptions.total },
    { label: "Transactions", href: "/admin/billing/transactions", icon: DollarSign, count: stats.billing.totalTransactions },
    { label: "Sessions", href: "/admin/sessions", icon: Shield, count: stats.security.activeSessions },
  ];

  const chartConfig = {
    users: { label: "Users", color: "hsl(var(--chart-1))" },
    conversations: { label: "Conversations", color: "hsl(var(--chart-2))" },
    value: { label: "Count" },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Platform overview and key metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 hidden sm:inline">Offline</span>
              </>
            )}
          </div>
          {lastUpdate && (
            <span className="text-xs text-gray-500 hidden md:inline">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.users.total.toLocaleString()}</p>
              <Users className="h-8 w-8 text-blue-500/50" />
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              +{stats.users.newToday} today, +{stats.users.newThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats.billing.totalRevenue)}</p>
              <DollarSign className="h-8 w-8 text-green-500/50" />
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {formatCurrency(stats.billing.revenueThisMonth)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.conversations.activeLast24h.toLocaleString()}</p>
              <MessageSquare className="h-8 w-8 text-purple-500/50" />
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              {stats.conversations.totalMessages.toLocaleString()} total messages
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.sites.total.toLocaleString()}</p>
              <Globe className="h-8 w-8 text-orange-500/50" />
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
              {stats.sites.totalUrlsIndexed.toLocaleString()} URLs indexed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attention Needed */}
      {attentionItems.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {attentionItems.map((item, index) => (
                <Link key={index} href={item.link}>
                  <Badge
                    variant={item.severity === "error" ? "destructive" : "outline"}
                    className="text-sm cursor-pointer hover:opacity-80"
                  >
                    {item.label}: {item.value}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Growth Overview</CardTitle>
            <CardDescription>New users and active conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={growthData}>
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="New Users" />
                <Bar dataKey="conversations" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Conversations" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={subscriptionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {subscriptionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics & Quick Access Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auth Provider Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auth Providers</CardTitle>
            <CardDescription>User distribution by login method</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={authProviderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  nameKey="name"
                >
                  {authProviderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {authProviderData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Crawl Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crawl Status</CardTitle>
            <CardDescription>Sites by crawl status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={crawlStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  nameKey="name"
                >
                  {crawlStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {crawlStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
            <CardDescription>Platform metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Embeddings</span>
              <span className="font-medium">{stats.embeddings.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <span className="font-medium">{stats.security.activeSessions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Storage Used</span>
              <span className="font-medium">{formatBytes(parseInt(stats.files.totalStorageBytes) || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tokens Used</span>
              <span className="font-medium">{stats.conversations.totalTokensUsed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Est. AI Cost</span>
              <span className="font-medium">{formatCurrency(stats.conversations.estimatedCostCents)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Access</CardTitle>
          <CardDescription>Navigate to different sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                  <link.icon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{link.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {link.count.toLocaleString()}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
