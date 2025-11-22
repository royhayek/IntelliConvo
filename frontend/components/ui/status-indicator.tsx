import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  siteStatusLabels,
  siteStatusAdminLabels,
  isSiteProcessing,
  type CrawlStatus,
} from "@/lib/utils/status-labels";

type StatusType = CrawlStatus | "active" | "inactive";

interface StatusIndicatorProps {
  status: StatusType | string;
  animated?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  isAdmin?: boolean;
  className?: string;
}

// Color configuration for each status
const statusColors: Record<StatusType, string> = {
  PENDING: "bg-gray-400 dark:bg-gray-500",
  CRAWLING: "bg-yellow-500 dark:bg-yellow-400",
  COMPLETED: "bg-green-500 dark:bg-green-400",
  FAILED: "bg-red-500 dark:bg-red-400",
  AWAITING_PAYMENT: "bg-amber-500 dark:bg-amber-400",
  PROCESSING: "bg-indigo-500 dark:bg-indigo-400",
  READY: "bg-green-500 dark:bg-green-400",
  PARTIAL: "bg-yellow-500 dark:bg-yellow-400",
  active: "bg-green-500 dark:bg-green-400",
  inactive: "bg-gray-400 dark:bg-gray-500",
};

// Legacy labels for active/inactive
const legacyLabels = {
  active: "Active",
  inactive: "Inactive",
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function StatusIndicator({
  status,
  animated = false,
  showLabel = true,
  size = "md",
  isAdmin = false,
  className,
}: StatusIndicatorProps) {
  // Handle unknown statuses by falling back to PENDING
  const knownStatus = status as StatusType;
  const color = statusColors[knownStatus] || statusColors.PENDING;

  // Get label based on status type and admin mode
  let label: string;
  if (status === "active" || status === "inactive") {
    label = legacyLabels[status];
  } else {
    const labels = isAdmin ? siteStatusAdminLabels : siteStatusLabels;
    label = labels[status as CrawlStatus];
  }

  // Determine if we should animate (processing states)
  const isProcessingState =
    status === "CRAWLING" ||
    status === "PROCESSING" ||
    status === "PENDING" ||
    (typeof status === "string" && isSiteProcessing(status as CrawlStatus));
  const shouldAnimate = animated && isProcessingState;

  const DotComponent = shouldAnimate ? motion.div : "div";
  const dotProps = shouldAnimate
    ? {
        animate: {
          scale: [1, 1.2, 1],
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      }
    : {};

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DotComponent
        className={cn("rounded-full", sizeClasses[size], color)}
        {...dotProps}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </div>
  );
}
