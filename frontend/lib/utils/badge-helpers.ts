import type { CrawlStatus } from "./status-labels";

export interface BadgeConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  label?: string;
}

/**
 * Get badge configuration for crawl status (admin view)
 */
export function getCrawlStatusBadgeConfig(status: string): BadgeConfig {
  const config: Record<string, BadgeConfig> = {
    READY: {
      variant: "default",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      label: "Ready",
    },
    COMPLETED: {
      variant: "default",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      label: "Crawl Completed",
    },
    CRAWLING: {
      variant: "secondary",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      label: "Crawling",
    },
    PROCESSING: {
      variant: "secondary",
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      label: "Generating Embeddings",
    },
    PENDING: {
      variant: "outline",
      label: "Pending",
    },
    PARTIAL: {
      variant: "default",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      label: "Partial",
    },
    AWAITING_PAYMENT: {
      variant: "default",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      label: "Awaiting Payment",
    },
    FAILED: {
      variant: "destructive",
      label: "Failed",
    },
  };
  return config[status] || { variant: "outline", label: status };
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  planType: string;
}

/**
 * Get badge configuration for subscription status (simple status only)
 */
export function getSubscriptionStatusBadgeConfig(status: string): BadgeConfig {
  const config: Record<string, BadgeConfig> = {
    ACTIVE: {
      variant: "default",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      label: "Active",
    },
    TRIAL: {
      variant: "secondary",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      label: "Trial",
    },
    TRIALING: {
      variant: "secondary",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      label: "Trialing",
    },
    PAST_DUE: {
      variant: "destructive",
      label: "Past Due",
    },
    CANCELLED: {
      variant: "outline",
      label: "Cancelled",
    },
    CANCELED: {
      variant: "outline",
      label: "Cancelled",
    },
    EXPIRED: {
      variant: "outline",
      label: "Expired",
    },
  };
  return config[status] || { variant: "outline", label: status };
}

/**
 * Get badge configuration for subscription status (with plan info)
 */
export function getSubscriptionBadgeConfig(
  subscription: SubscriptionInfo | null | undefined
): BadgeConfig & { displayText: string } {
  if (!subscription) {
    return {
      variant: "outline",
      displayText: "No Subscription",
    };
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    TRIALING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PAST_DUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    CANCELED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return {
    variant: "default",
    className: statusColors[subscription.status] || "",
    displayText: `${subscription.planType} - ${subscription.status}`,
  };
}

/**
 * Get badge configuration for transaction/payment status
 */
export function getTransactionStatusBadgeConfig(status: string): BadgeConfig {
  const config: Record<string, BadgeConfig> = {
    paid: {
      variant: "default",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      label: "Paid",
    },
    succeeded: {
      variant: "default",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      label: "Succeeded",
    },
    pending: {
      variant: "secondary",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      label: "Pending",
    },
    failed: {
      variant: "destructive",
      label: "Failed",
    },
    refunded: {
      variant: "secondary",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      label: "Refunded",
    },
    partially_refunded: {
      variant: "secondary",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      label: "Partially Refunded",
    },
    disputed: {
      variant: "secondary",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      label: "Disputed",
    },
  };
  return config[status] || { variant: "outline", label: status };
}

/**
 * Get badge configuration for auth provider
 */
export function getAuthProviderBadgeConfig(provider: string): BadgeConfig {
  const config: Record<string, BadgeConfig> = {
    google: {
      variant: "default",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      label: "Google",
    },
    github: {
      variant: "default",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
      label: "GitHub",
    },
    email: {
      variant: "default",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      label: "Email",
    },
    local: {
      variant: "default",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      label: "Email",
    },
  };
  return config[provider?.toLowerCase()] || { variant: "outline", label: provider };
}

/**
 * Get badge configuration for user role
 */
export function getUserRoleBadgeConfig(isAdmin: boolean): BadgeConfig {
  if (isAdmin) {
    return {
      variant: "default",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      label: "Admin",
    };
  }
  return {
    variant: "outline",
    label: "User",
  };
}

/**
 * Get badge configuration for embedding/URL status
 */
export function getEmbeddingStatusBadgeConfig(status: string): BadgeConfig {
  const config: Record<string, BadgeConfig> = {
    READY: {
      variant: "default",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      label: "Ready",
    },
    SCRAPED: {
      variant: "outline",
      label: "Discovered",
    },
    PENDING: {
      variant: "secondary",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      label: "Queued",
    },
    PROCESSING: {
      variant: "secondary",
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      label: "Processing",
    },
    FAILED: {
      variant: "destructive",
      label: "Failed",
    },
    EXCLUDED: {
      variant: "outline",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      label: "Excluded",
    },
  };
  return config[status] || { variant: "outline", label: status };
}

/**
 * Get badge configuration for dispute status
 */
export function getDisputeStatusBadgeConfig(status: string): BadgeConfig {
  const config: Record<string, BadgeConfig> = {
    needs_response: {
      variant: "default",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: "Needs Response",
    },
    under_review: {
      variant: "default",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: "Under Review",
    },
    won: {
      variant: "default",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: "Won",
    },
    lost: {
      variant: "default",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      label: "Lost",
    },
    warning_needs_response: {
      variant: "default",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      label: "Warning - Needs Response",
    },
    warning_under_review: {
      variant: "default",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      label: "Warning - Under Review",
    },
    warning_closed: {
      variant: "outline",
      label: "Warning Closed",
    },
    charge_refunded: {
      variant: "default",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      label: "Charge Refunded",
    },
  };
  return config[status] || { variant: "outline", label: status };
}

/**
 * Dispute reason labels for user-friendly display
 */
export const DISPUTE_REASON_LABELS: Record<string, string> = {
  duplicate: "Duplicate",
  fraudulent: "Fraudulent",
  subscription_canceled: "Subscription Canceled",
  product_unacceptable: "Product Unacceptable",
  product_not_received: "Product Not Received",
  unrecognized: "Unrecognized",
  credit_not_processed: "Credit Not Processed",
  general: "General",
};

/**
 * Get dispute reason label
 */
export function getDisputeReasonLabel(reason: string): string {
  return DISPUTE_REASON_LABELS[reason] || reason;
}

/**
 * Chart colors for consistent styling across charts
 */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];
