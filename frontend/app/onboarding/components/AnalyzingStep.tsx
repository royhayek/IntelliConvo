"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Clock, FileText, Zap, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Site } from "./types";

interface CrawlProgress {
  crawled: number;  // Total processed (success + failed)
  total: number;
  estimatedSecondsRemaining?: number;
  phase?: 'discovery' | 'crawling' | 'embedding';
  currentUrl?: string;
  successCount?: number;  // Successfully processed
  failedCount?: number;   // Failed to process
}

interface AnalyzingStepProps {
  site: Site | undefined;
  crawlProgress?: CrawlProgress | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) {
    return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

export const AnalyzingStep = memo(function AnalyzingStep({
  site,
  crawlProgress,
  onContinue,
  onRetry,
  onBack,
  onPause,
  onResume,
}: AnalyzingStepProps) {
  const isAnalyzing = site?.crawlStatus === "CRAWLING" || site?.crawlStatus === "PENDING" || site?.crawlStatus === "PROCESSING";
  const hasFailed = site?.crawlStatus === "FAILED";
  const isCompleted = site?.crawlStatus === "AWAITING_PAYMENT" || site?.crawlStatus === "READY";
  const isPaused = site?.crawlStatus === "PAUSED";
  const isEmbedding = crawlProgress?.phase === 'embedding' || site?.crawlStatus === "PROCESSING";

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (!crawlProgress || crawlProgress.total === 0) return 0;
    return Math.round((crawlProgress.crawled / crawlProgress.total) * 100);
  }, [crawlProgress]);

  // Loading state
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {/* Phase Indicator */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className={`flex items-center gap-1.5 ${isEmbedding ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isEmbedding ? 'bg-green-100 dark:bg-green-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                  {isEmbedding ? <CheckCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                </div>
                <span className="font-medium">Crawling</span>
              </div>
              <div className="h-px w-6 bg-gray-300 dark:bg-gray-600" />
              <div className={`flex items-center gap-1.5 ${isEmbedding ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isEmbedding ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <Zap className="h-3 w-3" />
                </div>
                <span className={isEmbedding ? 'font-medium' : ''}>Embedding</span>
              </div>
            </div>

            {/* Main Progress Area */}
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3"
              >
                <Loader2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </motion.div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Scanning <span className="font-medium text-gray-900 dark:text-white">{site?.siteUrl}</span>
              </p>
            </div>

            {/* Progress Bar with ETA */}
            {crawlProgress ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    {isEmbedding ? <Zap className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    {isEmbedding ? 'Generating embeddings...' : 'Crawling pages...'}
                  </span>
                  <span className="font-medium">
                    {crawlProgress.crawled} / {crawlProgress.total}
                    {crawlProgress.failedCount !== undefined && crawlProgress.failedCount > 0 && (
                      <span className="text-amber-500 ml-1">
                        ({crawlProgress.failedCount} failed)
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                {/* ETA and Stats Row */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {progressPercent}% complete
                  </span>
                  {crawlProgress.estimatedSecondsRemaining !== undefined && crawlProgress.estimatedSecondsRemaining > 0 && (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      ~{formatTimeRemaining(crawlProgress.estimatedSecondsRemaining)} remaining
                    </span>
                  )}
                </div>

                {/* Current URL (truncated) */}
                {crawlProgress.currentUrl && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate text-center">
                    {crawlProgress.currentUrl.replace(/^https?:\/\//, '').slice(0, 50)}...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex justify-center gap-1 py-2">
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

            {/* Pause Button */}
            {onPause && crawlProgress && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="w-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Paused state
  if (isPaused) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
              <Pause className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Crawl Paused
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your crawl is paused. You can resume at any time.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Cancel
              </Button>
              {onResume && (
                <Button onClick={onResume} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
            </div>
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
