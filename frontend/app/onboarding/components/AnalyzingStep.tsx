"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Site } from "./types";

interface AnalyzingStepProps {
  site: Site | undefined;
  crawlProgress?: { crawled: number; total: number } | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export const AnalyzingStep = memo(function AnalyzingStep({
  site,
  crawlProgress,
  onContinue,
  onRetry,
  onBack,
}: AnalyzingStepProps) {
  const isAnalyzing = site?.crawlStatus === "CRAWLING" || site?.crawlStatus === "PENDING";
  const hasFailed = site?.crawlStatus === "FAILED";
  const isCompleted = site?.crawlStatus === "AWAITING_PAYMENT";

  // Loading state
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4"
            >
              <Loader2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </motion.div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Scanning <span className="font-medium text-gray-900 dark:text-white">{site?.siteUrl}</span>
            </p>

            {crawlProgress ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Crawling pages...</span>
                  <span>{crawlProgress.crawled} / {crawlProgress.total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(crawlProgress.crawled / crawlProgress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Failed state
  if (hasFailed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We couldn't access your website. Please check the URL and try again.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Change URL
              </Button>
              <Button onClick={onRetry} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3"
            >
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </motion.div>

            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <span>{site?.urlCount || 0} pages found</span>
            </div>

            <Button
              onClick={onContinue}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
});
