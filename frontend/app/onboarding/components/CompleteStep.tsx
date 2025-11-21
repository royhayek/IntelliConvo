"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

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
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-8"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="h-12 w-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            You're All Set!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Congratulations {user?.fullName || "there"}! Your AI assistant is
            now ready to help visitors on {site?.siteName}. Let's explore what
            you can do next.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6"
          >
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Customize Widget
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Style your chat widget to match your brand
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6"
          >
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
              Add Integration
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Install the widget on your website
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6"
          >
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              Monitor Analytics
            </h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Track conversations and performance
            </p>
          </motion.div>
        </div>

        <Button
          onClick={onContinue}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-3"
        >
          Go to Site Dashboard
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
});
