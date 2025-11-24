"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionBlockedMessageProps {
  siteId: string;
  isExpired: boolean;
}

export function SubscriptionBlockedMessage({
  siteId,
  isExpired,
}: SubscriptionBlockedMessageProps) {
  return (
    <div className="mt-20 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center glass-effect rounded-3xl p-12 shadow-soft max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
            isExpired
              ? "bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30"
              : "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30"
          }`}
        >
          <AlertTriangle
            className={`h-10 w-10 ${
              isExpired
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {isExpired ? "Subscription Expired" : "Subscription Cancelled"}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {isExpired
            ? "Your payment method failed and your subscription has expired."
            : "Your subscription for this site has been cancelled."}
        </p>
        <p className="text-gray-500 dark:text-gray-500 mb-8">
          {isExpired
            ? "Please update your payment method to continue using your AI chatbot."
            : "Reactivate your subscription to continue managing your AI chatbot and providing support to your website visitors."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/account/subscriptions?siteId=${siteId}`}>
            <Button variant="gradient" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              {isExpired ? "Update Payment" : "Reactivate Subscription"}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
