"use client";

import { Receipt, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface BillingStats {
  totalTransactions: number;
  totalRevenue: number;
  revenueThisMonth: number;
  transactionsByStatus: { status: string; count: number }[];
}

interface TransactionsStatsCardsProps {
  stats: BillingStats | undefined;
}

export function TransactionsStatsCards({ stats }: TransactionsStatsCardsProps) {
  if (!stats) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Revenue (This Month)"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          label="Paid Transactions"
          value={stats.transactionsByStatus.find(s => s.status === 'paid')?.count || 0}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {stats.transactionsByStatus.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transactions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.transactionsByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
