/**
 * Dashboard statistics utility functions
 */

import type { LucideIcon } from "lucide-react";
import type { SiteResponse } from "@/lib/api/generated/models";

export interface DashboardStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "red" | "orange" | "indigo";
}

/**
 * Compute dashboard statistics from sites data
 */
export function computeDashboardStats(
  sites: SiteResponse[],
  icons: {
    totalSites: LucideIcon;
    activeSites: LucideIcon;
    totalUrls: LucideIcon;
  }
): DashboardStat[] {
  const activeSitesCount = sites.filter(
    (s) => s.crawlStatus === "READY" || s.crawlStatus === "PARTIAL"
  ).length;

  const totalUrlsCount = sites.reduce((sum, s) => sum + (s.urlCount ?? 0), 0);

  return [
    {
      label: "Total Sites",
      value: sites.length,
      icon: icons.totalSites,
      color: "blue",
    },
    {
      label: "Active Sites",
      value: activeSitesCount,
      icon: icons.activeSites,
      color: "green",
    },
    {
      label: "Total URLs",
      value: totalUrlsCount,
      icon: icons.totalUrls,
      color: "purple",
    },
  ];
}
