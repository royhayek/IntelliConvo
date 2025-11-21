import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StatusType = "COMPLETED" | "CRAWLING" | "PROCESSING" | "FAILED" | "PENDING" | "active" | "inactive";

interface StatusIndicatorProps {
  status: StatusType;
  animated?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig = {
  COMPLETED: {
    color: "bg-green-500 dark:bg-green-400",
    label: "Completed",
  },
  CRAWLING: {
    color: "bg-yellow-500 dark:bg-yellow-400",
    label: "In Progress",
  },
  PROCESSING: {
    color: "bg-blue-500 dark:bg-blue-400",
    label: "Processing",
  },
  FAILED: {
    color: "bg-red-500 dark:bg-red-400",
    label: "Failed",
  },
  PENDING: {
    color: "bg-gray-400 dark:bg-gray-500",
    label: "Pending",
  },
  active: {
    color: "bg-green-500 dark:bg-green-400",
    label: "Active",
  },
  inactive: {
    color: "bg-gray-400 dark:bg-gray-500",
    label: "Inactive",
  },
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
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const shouldAnimate = animated && (status === "CRAWLING" || status === "PROCESSING");

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
        className={cn("rounded-full", sizeClasses[size], config.color)}
        {...dotProps}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      )}
    </div>
  );
}
