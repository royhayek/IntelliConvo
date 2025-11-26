"use client";

import { motion } from "framer-motion";
import { Globe, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteAvatar } from "@/components/site/site-avatar";
import type { DisplayStatusConfig } from "@/lib/utils/status-labels";
import type { SiteResponse } from "@/lib/api/generated/models";

// Helper function to display clean site name (removes www.)
function getDisplayName(siteName: string): string {
  return siteName.startsWith('www.') ? siteName.substring(4) : siteName;
}

interface SiteHeaderProps {
  site: SiteResponse;
  displayStatus: DisplayStatusConfig;
}

export function SiteHeader({ site, displayStatus }: SiteHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 sm:space-x-4"
          >
            <SiteAvatar
              siteName={site.siteName}
              imageUrl={site.faviconUrl ?? undefined}
              size="xl"
              className="hidden sm:block"
            />
            <SiteAvatar
              siteName={site.siteName}
              imageUrl={site.faviconUrl ?? undefined}
              size="lg"
              className="sm:hidden"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                {getDisplayName(site.siteName)}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1 truncate">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{site.siteUrl}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <div className="glass-effect rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {site.urlCount} URL{site.urlCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="glass-effect rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <span className="hidden sm:inline">Updated </span>
                  {new Date(site.lastCrawledAt || site.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Badge
              variant={displayStatus.variant}
              className={`flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm ${displayStatus.badgeClass}`}
            >
              <motion.div
                animate={{
                  scale: displayStatus.animate ? [1, 1.3, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: displayStatus.animate ? Infinity : 0,
                }}
                className={`h-2 w-2 rounded-full ${displayStatus.dotColor}`}
              ></motion.div>
              <span>{displayStatus.label}</span>
            </Badge>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
