"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatBytes, formatCents } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types/admin-dashboard";

interface SystemHealthCardProps {
  stats: DashboardStats;
}

export function SystemHealthCard({ stats }: SystemHealthCardProps) {
  return (
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
          <span className="font-medium">
            {formatBytes(parseInt(stats.files.totalStorageBytes) || 0)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Tokens Used</span>
          <span className="font-medium">
            {stats.conversations.totalTokensUsed.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Est. AI Cost</span>
          <span className="font-medium">
            {formatCents(stats.conversations.estimatedCostCents)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
