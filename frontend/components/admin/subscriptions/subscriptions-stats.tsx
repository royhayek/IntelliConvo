"use client";

import { CreditCard, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

interface SubscriptionStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byPlanType: { planType: string; count: number }[];
  expiringTrialsNext7Days: number;
}

interface SubscriptionsStatsProps {
  stats: SubscriptionStats;
}

export function SubscriptionsStats({ stats }: SubscriptionsStatsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Subscriptions"
          value={stats.total.toLocaleString()}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          label="Active"
          value={stats.byStatus.find((s) => s.status === "ACTIVE")?.count || 0}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          label="Trials"
          value={stats.byStatus.find((s) => s.status === "TRIAL")?.count || 0}
          icon={Clock}
          color="purple"
        />
        <StatCard
          label="Expiring Trials (7 days)"
          value={stats.expiringTrialsNext7Days}
          icon={AlertTriangle}
          color={stats.expiringTrialsNext7Days > 0 ? "orange" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.byStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Plan Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.byPlanType.map((item) => (
                <div key={item.planType} className="flex items-center gap-2">
                  <Badge variant="outline">{item.planType}</Badge>
                  <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
