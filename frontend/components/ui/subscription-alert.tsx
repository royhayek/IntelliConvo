"use client";

import Link from "next/link";
import { AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SiteResponse } from "@/lib/api/generated/models";

interface SubscriptionAlertProps {
  sites: SiteResponse[];
  className?: string;
}

/**
 * Alert component that shows when any site has a cancelled or expired subscription
 */
export function SubscriptionAlert({ sites, className }: SubscriptionAlertProps) {
  // Find sites with subscription issues
  const cancelledSites = sites.filter(
    (site) =>
      site.subscription?.status === "CANCELLED" ||
      site.subscription?.cancelAtPeriodEnd === true
  );

  const expiredSites = sites.filter(
    (site) => site.subscription?.status === "EXPIRED"
  );

  if (cancelledSites.length === 0 && expiredSites.length === 0) {
    return null;
  }

  // Prioritize expired sites over cancelled
  if (expiredSites.length > 0) {
    const site = expiredSites[0];
    return (
      <Alert variant="destructive" className={className}>
        <XCircle className="h-4 w-4" />
        <AlertTitle>Subscription Expired</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            Your subscription for <strong>{site.siteName}</strong> has expired.
            The AI chatbot is currently disabled on your website.
          </span>
          <Link href={`/account/subscriptions?siteId=${site.id}`}>
            <Button size="sm" variant="outline" className="whitespace-nowrap">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reactivate Now
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Show cancelled/pending cancellation alert
  const site = cancelledSites[0];
  const isPendingCancellation = site.subscription?.cancelAtPeriodEnd === true;
  const endDate = site.subscription?.currentPeriodEnd
    ? new Date(site.subscription.currentPeriodEnd).toLocaleDateString()
    : "soon";

  return (
    <Alert
      variant="default"
      className={`border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 ${className}`}
    >
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-300">
        {isPendingCancellation ? "Cancellation Pending" : "Subscription Cancelled"}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-700 dark:text-amber-400">
        <span>
          {isPendingCancellation ? (
            <>
              Your subscription for <strong>{site.siteName}</strong> will end on{" "}
              <strong>{endDate}</strong>. After this date, your AI chatbot will be
              disabled.
            </>
          ) : (
            <>
              Your subscription for <strong>{site.siteName}</strong> has been
              cancelled. Reactivate to continue using the AI chatbot.
            </>
          )}
        </span>
        <Link href={`/account/subscriptions?siteId=${site.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isPendingCancellation ? "Keep Subscription" : "Reactivate"}
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
