"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Subscription } from "@/lib/api/generated/models";

interface CurrentSubscriptionCardProps {
  subscription: Subscription;
  onManage: () => void;
  onReactivate: () => void;
  isManaging: boolean;
  isReactivating: boolean;
}

export function CurrentSubscriptionCard({
  subscription,
  onManage,
  onReactivate,
  isManaging,
  isReactivating,
}: CurrentSubscriptionCardProps) {
  const isPendingCancellation = subscription.cancelAtPeriodEnd;
  const isActive = subscription.status === "ACTIVE";
  const isTrial = subscription.status === "TRIAL";

  const bgClass = isPendingCancellation
    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
    : isActive
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50";

  const textClass = isPendingCancellation
    ? "text-amber-900 dark:text-amber-300"
    : isActive
      ? "text-green-900 dark:text-green-300"
      : "text-blue-900 dark:text-blue-300";

  const subTextClass = isPendingCancellation
    ? "text-amber-700 dark:text-amber-400"
    : isActive
      ? "text-green-700 dark:text-green-400"
      : "text-blue-700 dark:text-blue-400";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${bgClass}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${textClass}`}>
                    {subscription.planType === "PREMIUM_ANNUAL" ? "Premium Annual" : "Premium Monthly"}
                    {isTrial && " (Trial)"}
                  </h4>
                  {isPendingCancellation && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300">
                      Cancellation Pending
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${subTextClass}`}>
                  {subscription.planType === "PREMIUM_ANNUAL" ? "$279/year" : "$29/month"}
                </p>
                <p className={`text-sm mt-2 ${subTextClass}`}>
                  {isPendingCancellation
                    ? `Cancels on: ${new Date(subscription.currentPeriodEnd!).toLocaleDateString()}`
                    : isTrial
                      ? `Trial ends: ${new Date(subscription.trialEndsAt!).toLocaleDateString()}`
                      : `Next billing: ${new Date(subscription.currentPeriodEnd!).toLocaleDateString()}`
                  }
                </p>
                {isPendingCancellation && (
                  <p className="text-sm mt-2 text-amber-600 dark:text-amber-400">
                    Your subscription will remain active until the end of the current billing period.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {isPendingCancellation ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onReactivate}
                    disabled={isReactivating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isReactivating ? "Reactivating..." : "Keep Subscription"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onManage}
                    disabled={isManaging}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isManaging ? "Loading..." : "Manage"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
