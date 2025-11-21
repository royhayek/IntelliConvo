"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SiteNavigationSidebarProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SiteNavigationSidebar({
  tabs,
  activeTab,
  onTabChange,
}: SiteNavigationSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full"
    >
      <div className="sticky top-24">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left w-full",
                    isActive
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-700/80"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  />
                  <span className="truncate">{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    </motion.aside>
  );
}
