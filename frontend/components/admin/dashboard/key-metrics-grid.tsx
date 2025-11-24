"use client";

import { Users, DollarSign, MessageSquare, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types/admin-dashboard";

interface KeyMetricsGridProps {
  stats: DashboardStats;
}

export function KeyMetricsGrid({ stats }: KeyMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.users.total.toLocaleString()}
            </p>
            <Users className="h-8 w-8 text-blue-500/50" />
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            +{stats.users.newToday} today, +{stats.users.newThisWeek} this week
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(stats.billing.totalRevenue)}
            </p>
            <DollarSign className="h-8 w-8 text-green-500/50" />
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            {formatCurrency(stats.billing.revenueThisMonth)} this month
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Active Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.conversations.activeLast24h.toLocaleString()}
            </p>
            <MessageSquare className="h-8 w-8 text-purple-500/50" />
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
            {stats.conversations.totalMessages.toLocaleString()} total messages
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Active Sites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {stats.sites.total.toLocaleString()}
            </p>
            <Globe className="h-8 w-8 text-orange-500/50" />
          </div>
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
            {stats.sites.totalUrlsIndexed.toLocaleString()} URLs indexed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
