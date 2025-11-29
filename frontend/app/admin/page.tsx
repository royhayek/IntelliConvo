"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminSocket } from "@/lib/hooks/useAdminSocket";
import {
  useGetAdminStatsUsers,
  useGetAdminStatsSites,
  useGetAdminStatsEmbeddings,
  useGetAdminStatsFiles,
  useGetAdminStatsConversations,
  useGetAdminStatsSubscriptions,
  useGetAdminStatsSecurity,
  useGetAdminStatsBilling,
} from "@/lib/api/generated/queries/admin/admin";

import { KeyMetricsGrid } from "@/components/admin/dashboard/key-metrics-grid";
import { AttentionItemsCard } from "@/components/admin/dashboard/attention-items-card";
import { QuickAccessGrid } from "@/components/admin/dashboard/quick-access-grid";
import { SystemHealthCard } from "@/components/admin/dashboard/system-health-card";
import {
  GrowthChart,
  SubscriptionStatusChart,
  AuthProviderChart,
  CrawlStatusChart,
} from "@/components/admin/dashboard/dashboard-charts";
import { buildAttentionItems, buildQuickLinks } from "@/lib/utils/admin-dashboard";
import type { DashboardStats } from "@/lib/types/admin-dashboard";

export default function AdminDashboard() {
  const [wsStats, setWsStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleStatsUpdate = useCallback((newStats: DashboardStats) => {
    setWsStats(newStats);
    setIsRefreshing(false);
  }, []);

  const { isConnected, lastUpdate, requestRefresh } = useAdminSocket({
    onStatsUpdate: handleStatsUpdate,
    autoConnect: true,
  });

  const hasWsData = wsStats !== null;

  const usersQuery = useGetAdminStatsUsers({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const sitesQuery = useGetAdminStatsSites({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const embeddingsQuery = useGetAdminStatsEmbeddings({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const filesQuery = useGetAdminStatsFiles({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const conversationsQuery = useGetAdminStatsConversations({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const subscriptionsQuery = useGetAdminStatsSubscriptions({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const securityQuery = useGetAdminStatsSecurity({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });
  const billingQuery = useGetAdminStatsBilling({
    query: { enabled: !hasWsData, staleTime: 30000 },
  });

  const isLoading =
    !hasWsData &&
    (usersQuery.isLoading ||
      sitesQuery.isLoading ||
      embeddingsQuery.isLoading ||
      filesQuery.isLoading ||
      conversationsQuery.isLoading ||
      subscriptionsQuery.isLoading ||
      securityQuery.isLoading ||
      billingQuery.isLoading);

  const queryError =
    usersQuery.error ||
    sitesQuery.error ||
    embeddingsQuery.error ||
    filesQuery.error ||
    conversationsQuery.error ||
    subscriptionsQuery.error ||
    securityQuery.error ||
    billingQuery.error;

  const stats = useMemo<DashboardStats | null>(() => {
    if (wsStats) return wsStats;

    const usersData = usersQuery.data?.data as DashboardStats["users"] | undefined;
    const sitesData = sitesQuery.data?.data as DashboardStats["sites"] | undefined;
    const embeddingsData = embeddingsQuery.data?.data as DashboardStats["embeddings"] | undefined;
    const filesData = filesQuery.data?.data as DashboardStats["files"] | undefined;
    const conversationsData = conversationsQuery.data?.data as DashboardStats["conversations"] | undefined;
    const subscriptionsData = subscriptionsQuery.data?.data as DashboardStats["subscriptions"] | undefined;
    const securityData = securityQuery.data?.data as DashboardStats["security"] | undefined;
    const billingData = billingQuery.data?.data as DashboardStats["billing"] | undefined;

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

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    requestRefresh();
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
          {queryError instanceof Error
            ? queryError.message
            : "Failed to fetch dashboard statistics"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const attentionItems = buildAttentionItems(stats);
  const quickLinks = buildQuickLinks(stats);

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
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 hidden sm:inline">
                  Live
                </span>
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
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <KeyMetricsGrid stats={stats} />

      {/* Attention Needed */}
      <AttentionItemsCard items={attentionItems} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart stats={stats} />
        <SubscriptionStatusChart stats={stats} />
      </div>

      {/* Additional Metrics & Quick Access Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AuthProviderChart stats={stats} />
        <CrawlStatusChart stats={stats} />
        <SystemHealthCard stats={stats} />
      </div>

      {/* Quick Access Links */}
      <QuickAccessGrid links={quickLinks} />
    </div>
  );
}
