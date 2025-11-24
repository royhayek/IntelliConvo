"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditStats {
  totalLogs?: number;
  logsToday?: number;
  logsThisWeek?: number;
  logsThisMonth?: number;
  failedActions?: number;
  topAdmins?: { adminId: string; adminEmail: string; actionCount: number }[];
}

interface AuditStatsCardsProps {
  stats: AuditStats | undefined;
  isLoading: boolean;
}

export function AuditStatsCards({ stats, isLoading }: AuditStatsCardsProps) {
  if (!stats || isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalLogs?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            {stats.logsToday?.toLocaleString() ?? 0}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.logsThisWeek?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.logsThisMonth?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Failed Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {stats.failedActions?.toLocaleString() ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
