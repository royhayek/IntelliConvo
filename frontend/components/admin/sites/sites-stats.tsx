"use client";

import { Globe, Link2, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface SiteStats {
  total: number;
  totalUrlsIndexed: number;
  urlsPendingCrawl: number;
  failedCrawlsLast24h: number;
}

interface SitesStatsProps {
  stats: SiteStats;
}

export function SitesStats({ stats }: SitesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Sites"
        value={stats.total.toLocaleString()}
        icon={Globe}
        color="blue"
      />
      <StatCard
        label="URLs Indexed"
        value={stats.totalUrlsIndexed.toLocaleString()}
        icon={Link2}
        color="green"
      />
      <StatCard
        label="Pending Crawl"
        value={stats.urlsPendingCrawl}
        icon={Clock}
        color="orange"
      />
      <StatCard
        label="Failed (24h)"
        value={stats.failedCrawlsLast24h}
        icon={AlertTriangle}
        color={stats.failedCrawlsLast24h > 0 ? "red" : "green"}
      />
    </div>
  );
}
