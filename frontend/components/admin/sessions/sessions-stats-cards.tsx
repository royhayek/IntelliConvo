"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SessionStats {
  totalSessions?: number;
  activeSessions?: number;
  sessionsCreatedLast24h?: number;
  expiredTokensNeedingCleanup?: number;
  usersWithMultipleSessions?: number;
}

interface SessionsStatsCardsProps {
  stats: SessionStats | undefined;
  isLoading: boolean;
}

export function SessionsStatsCards({ stats, isLoading }: SessionsStatsCardsProps) {
  if (!stats || isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalSessions?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{stats.activeSessions?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">New Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.sessionsCreatedLast24h?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Expired (Cleanup)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-600">{stats.expiredTokensNeedingCleanup?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Multi-Session Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.usersWithMultipleSessions?.toLocaleString() ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}
