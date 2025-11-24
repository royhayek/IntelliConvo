"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteNotFound() {
  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center glass-effect rounded-3xl p-12 shadow-soft"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="h-20 w-20 rounded-3xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto mb-6"
        >
          <svg
            className="h-10 w-10 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h8m-8 0H4"
            />
          </svg>
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Site not found
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          The site you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/dashboard">
          <Button variant="gradient" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
