/**
 * Status Label Utilities
 * Maps technical statuses to user-friendly labels for different audiences
 */

// Site crawl status - backend uses CrawlStatus enum
export type CrawlStatus =
  | "PENDING"
  | "CRAWLING"
  | "COMPLETED"
  | "FAILED"
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "READY"
  | "PARTIAL";

// URL embedding status - backend uses UrlEmbeddingStatus enum
export type UrlEmbeddingStatus =
  | "SCRAPING"
  | "SCRAPED"
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "EXCLUDED";

// User-friendly labels for site status (shown to site owners)
export const siteStatusLabels: Record<CrawlStatus, string> = {
  PENDING: "Setting up",
  CRAWLING: "Analyzing website",
  COMPLETED: "Analysis complete",
  FAILED: "Setup failed",
  AWAITING_PAYMENT: "Awaiting activation",
  PROCESSING: "Setting up assistant",
  READY: "Active",
  PARTIAL: "Partially ready",
};

// Admin labels for site status (technical terms)
export const siteStatusAdminLabels: Record<CrawlStatus, string> = {
  PENDING: "Pending",
  CRAWLING: "Crawling",
  COMPLETED: "Crawl Completed",
  FAILED: "Crawl Failed",
  AWAITING_PAYMENT: "Awaiting Payment",
  PROCESSING: "Generating Embeddings",
  READY: "Ready",
  PARTIAL: "Partial",
};

// User-friendly labels for URL/page status (shown to site owners)
export const urlStatusLabels: Record<UrlEmbeddingStatus, string> = {
  SCRAPING: "Analyzing",
  SCRAPED: "Discovered",
  PENDING: "Queued",
  PROCESSING: "Processing",
  READY: "Active",
  FAILED: "Error",
  EXCLUDED: "Excluded",
};

// Admin labels for URL status (technical terms)
export const urlStatusAdminLabels: Record<UrlEmbeddingStatus, string> = {
  SCRAPING: "Scraping",
  SCRAPED: "Scraped",
  PENDING: "Embedding Pending",
  PROCESSING: "Embedding Processing",
  READY: "Embedding Ready",
  FAILED: "Embedding Failed",
  EXCLUDED: "Excluded",
};

// User-friendly descriptions for site status
export const siteStatusDescriptions: Record<CrawlStatus, string> = {
  PENDING: "Your website is being prepared for analysis.",
  CRAWLING: "We're discovering all the pages on your website.",
  COMPLETED: "Website analysis is complete.",
  FAILED: "We couldn't access your website. Please check the URL and try again.",
  AWAITING_PAYMENT: "Complete your subscription to activate your assistant.",
  PROCESSING: "We're setting up your AI assistant with your website content.",
  READY: "Your AI assistant is live and ready to help visitors.",
  PARTIAL: "Some pages couldn't be processed. Your assistant is active with available content.",
};

// User-friendly descriptions for URL status
export const urlStatusDescriptions: Record<UrlEmbeddingStatus, string> = {
  SCRAPING: "This page is currently being analyzed.",
  SCRAPED: "Content has been discovered and is waiting to be activated.",
  PENDING: "This page is queued for processing.",
  PROCESSING: "This page is being processed for your assistant.",
  READY: "This page is active and your assistant can answer questions about it.",
  FAILED: "This page couldn't be processed. Try re-crawling it.",
  EXCLUDED: "This page is excluded from your assistant's knowledge.",
};

// Status colors/variants for badges
export const siteStatusVariants: Record<CrawlStatus, {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  PENDING: {
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  },
  CRAWLING: {
    variant: "default",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  COMPLETED: {
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  FAILED: {
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  AWAITING_PAYMENT: {
    variant: "default",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  PROCESSING: {
    variant: "default",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  READY: {
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  PARTIAL: {
    variant: "default",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
};

export const urlStatusVariants: Record<UrlEmbeddingStatus, {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  SCRAPING: {
    variant: "default",
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  SCRAPED: {
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  },
  PENDING: {
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  PROCESSING: {
    variant: "default",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  READY: {
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  FAILED: {
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  EXCLUDED: {
    variant: "outline",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

// Helper functions
export function getSiteStatusLabel(status: CrawlStatus, isAdmin = false): string {
  return isAdmin ? siteStatusAdminLabels[status] : siteStatusLabels[status];
}

export function getUrlStatusLabel(status: UrlEmbeddingStatus, isAdmin = false): string {
  return isAdmin ? urlStatusAdminLabels[status] : urlStatusLabels[status];
}

export function getSiteStatusDescription(status: CrawlStatus): string {
  return siteStatusDescriptions[status];
}

export function getUrlStatusDescription(status: UrlEmbeddingStatus): string {
  return urlStatusDescriptions[status];
}

// Check if site is in a loading/processing state
export function isSiteProcessing(status: CrawlStatus): boolean {
  return ["PENDING", "CRAWLING", "PROCESSING"].includes(status);
}

// Check if site is ready for use
export function isSiteReady(status: CrawlStatus): boolean {
  return ["READY", "PARTIAL"].includes(status);
}

// Check if URL is ready for use
export function isUrlReady(status: UrlEmbeddingStatus): boolean {
  return status === "READY";
}

// Check if URL is in a processing/loading state
export function isUrlProcessing(status: UrlEmbeddingStatus): boolean {
  return ["SCRAPING", "PENDING", "PROCESSING"].includes(status);
}

// Check if URL needs attention
export function urlNeedsAttention(status: UrlEmbeddingStatus): boolean {
  return ["FAILED", "EXCLUDED"].includes(status);
}

// Subscription status type
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING" | null | undefined;

// Display status configuration for site dashboard
export interface DisplayStatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive";
  dotColor: string;
  badgeClass: string;
  animate: boolean;
}

/**
 * Get display status configuration based on subscription and crawl status.
 * Subscription status takes priority over crawl status.
 */
export function getDisplayStatus(
  subscriptionStatus: SubscriptionStatus,
  crawlStatus: CrawlStatus
): DisplayStatusConfig {
  // Subscription issues take priority
  if (subscriptionStatus === "CANCELLED") {
    return {
      label: "Cancelled",
      variant: "destructive",
      dotColor: "bg-red-500",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      animate: false,
    };
  }
  if (subscriptionStatus === "EXPIRED") {
    return {
      label: "Expired",
      variant: "destructive",
      dotColor: "bg-red-500",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      animate: false,
    };
  }

  // Otherwise show crawl status
  switch (crawlStatus) {
    case "READY":
      return {
        label: "Active",
        variant: "default",
        dotColor: "bg-green-500",
        badgeClass:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        animate: false,
      };
    case "COMPLETED":
      return {
        label: "Analyzing content...",
        variant: "default",
        dotColor: "bg-green-500",
        badgeClass:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        animate: false,
      };
    case "CRAWLING":
      return {
        label: "Scanning website...",
        variant: "secondary",
        dotColor: "bg-yellow-500",
        badgeClass:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        animate: true,
      };
    case "PROCESSING":
      return {
        label: "Setting up assistant...",
        variant: "secondary",
        dotColor: "bg-indigo-500",
        badgeClass:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        animate: true,
      };
    case "PARTIAL":
      return {
        label: "Partially ready",
        variant: "secondary",
        dotColor: "bg-yellow-500",
        badgeClass:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        animate: false,
      };
    case "AWAITING_PAYMENT":
      return {
        label: "Awaiting activation",
        variant: "secondary",
        dotColor: "bg-amber-500",
        badgeClass:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        animate: false,
      };
    case "FAILED":
      return {
        label: "Setup failed",
        variant: "destructive",
        dotColor: "bg-red-500",
        badgeClass:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
        animate: false,
      };
    case "PENDING":
    default:
      return {
        label: "Setting up...",
        variant: "secondary",
        dotColor: "bg-gray-500",
        badgeClass: "",
        animate: true,
      };
  }
}
