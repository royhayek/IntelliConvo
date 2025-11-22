"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Palette, Code, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Site, User } from "./types";

interface CompleteStepProps {
  site: Site | undefined;
  user: User | null;
  onContinue: () => void;
}

export const CompleteStep = memo(function CompleteStep({
  site,
  user,
  onContinue,
}: CompleteStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-3"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your AI assistant for <span className="font-medium text-gray-900 dark:text-white">{site?.siteName}</span> is ready!
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
          >
            <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Customize</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
          >
            <Code className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Install</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
          >
            <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Analytics</p>
          </motion.div>
        </div>

        <Button
          onClick={onContinue}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
});
