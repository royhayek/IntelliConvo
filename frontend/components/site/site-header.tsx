"use client";

import { motion } from "framer-motion";
import { Globe, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteAvatar } from "@/components/site/site-avatar";
import type { DisplayStatusConfig } from "@/lib/utils/status-labels";
import type { SiteResponse } from "@/lib/api/generated/models";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            <SiteAvatar
              siteName={site.siteName}
              imageUrl={site.faviconUrl ?? undefined}
              size="xl"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {site.siteName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                <Globe className="w-4 h-4 mr-1" />
                {site.siteUrl}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="glass-effect rounded-xl px-4 py-2 border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {site.urlCount} URLs
                </span>
              </div>
            </div>

            <div className="glass-effect rounded-xl px-4 py-2 border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Updated{" "}
                  {new Date(
                    site.lastCrawledAt || site.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Badge
              variant={displayStatus.variant}
              className={`flex items-center space-x-2 text-sm ${displayStatus.badgeClass}`}
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
