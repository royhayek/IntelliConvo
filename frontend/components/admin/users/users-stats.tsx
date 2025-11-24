"use client";

import { Users, TrendingUp, Clock, Shield } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface UserStats {
  total: number;
  newToday: number;
  activeLastWeek: number;
  adminCount: number;
}

interface UsersStatsProps {
  stats: UserStats;
}

export function UsersStats({ stats }: UsersStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Users"
        value={stats.total.toLocaleString()}
        icon={Users}
        color="blue"
      />
      <StatCard
        label="New Today"
        value={stats.newToday}
        icon={TrendingUp}
        color="green"
      />
      <StatCard
        label="Active (7 days)"
        value={stats.activeLastWeek}
        icon={Clock}
        color="purple"
      />
      <StatCard
        label="Admin Users"
        value={stats.adminCount}
        icon={Shield}
        color="indigo"
      />
    </div>
  );
}
