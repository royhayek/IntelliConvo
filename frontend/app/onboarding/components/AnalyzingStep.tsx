"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Site } from "./types";

interface AnalyzingStepProps {
  site: Site | undefined;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export const AnalyzingStep = memo(function AnalyzingStep({
  site,
  onContinue,
  onRetry,
  onBack,
}: AnalyzingStepProps) {
  const isAnalyzing = site?.crawlStatus === "CRAWLING" || site?.crawlStatus === "PENDING";
  const hasFailed = site?.crawlStatus === "FAILED";
  const isCompleted = site?.crawlStatus === "COMPLETED";

  // Loading state - simple and clean
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
          <div className="text-center">
            {/* Animated loader */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8"
            >
              <Loader2 className="h-10 w-10 text-white" />
            </motion.div>

            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Analyzing Your Website
            </h3>

            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We're scanning <span className="font-medium text-gray-900">{site?.siteUrl}</span> and
              discovering all the pages that will help train your AI assistant.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">
                This usually takes 1-2 minutes depending on the size of your website.
              </p>
            </div>

            {/* Animated dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-indigo-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
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
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="h-10 w-10 text-red-600" />
            </motion.div>

            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Unable to Analyze Website
            </h3>

            <div className="bg-red-50 rounded-xl p-6 mb-8">
              <p className="text-sm text-red-800 mb-4">
                We couldn't access your website. This might be because:
              </p>
              <ul className="text-sm text-red-700 space-y-2 text-left max-w-sm mx-auto">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The website is blocking automated access</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The website is temporarily unavailable</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The URL requires authentication</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The URL is incorrect or unreachable</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                Try Different URL
              </Button>
              <Button
                onClick={onRetry}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Retry Analysis
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
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>

            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Analysis Complete!
            </h3>

            <div className="bg-green-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-700">
                    {site?.urlCount || 0}
                  </div>
                  <div className="text-sm text-green-600">Pages Found</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-700">100%</div>
                  <div className="text-sm text-green-600">Analyzed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-700">
                    <CheckCircle className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="text-sm text-green-600">Ready</div>
                </div>
              </div>
            </div>

            <Button
              onClick={onContinue}
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Continue to Review
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default loading state (shouldn't normally reach here)
  return null;
});
