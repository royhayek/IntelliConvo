"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Site, SiteUrl } from "./types";

interface SitemapStepProps {
  site: Site | undefined;
  urls: SiteUrl[];
  showAll: boolean;
  onToggleShowAll: () => void;
  onContinue: () => void;
}

export const SitemapStep = memo(function SitemapStep({
  site,
  urls,
  showAll,
  onToggleShowAll,
  onContinue,
}: SitemapStepProps) {
  const displayedUrls = useMemo(() => {
    return showAll ? urls : urls.slice(0, 10);
  }, [urls, showAll]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {urls.length} Pages Discovered
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            These pages will be used to train your AI assistant
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{urls.length}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Pages</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 truncate">
              {site?.siteName}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Website</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">Ready</div>
            <div className="text-sm text-green-600 dark:text-green-400">Status</div>
          </div>
        </div>
      </div>

      {/* URL List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Discovered Pages
        </h4>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayedUrls.map((url, index) => (
            <motion.div
              key={url.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
            >
              <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                {url.url}
              </span>
              {url.title && (
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:block truncate max-w-[200px]">
                  {url.title}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {urls.length > 10 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={onToggleShowAll}
              className="text-sm"
            >
              {showAll ? "Show Less" : `Show All ${urls.length} Pages`}
            </Button>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <Button
          onClick={onContinue}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3"
        >
          Continue to Plan Selection
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
});
