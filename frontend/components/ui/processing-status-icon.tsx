import { CheckCircle, Clock, AlertCircle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessingStatus = "COMPLETED" | "PROCESSING" | "FAILED" | "PENDING" | "QUEUED" | "ERROR";

interface ProcessingStatusIconProps {
  status: ProcessingStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  COMPLETED: {
    icon: CheckCircle,
    label: "Processed",
    className: "text-green-600 dark:text-green-400",
    animate: false,
  },
  PROCESSING: {
    icon: Loader2,
    label: "Processing...",
    className: "text-yellow-600 dark:text-yellow-400",
    animate: true,
  },
  FAILED: {
    icon: AlertCircle,
    label: "Failed",
    className: "text-red-600 dark:text-red-400",
    animate: false,
  },
  ERROR: {
    icon: XCircle,
    label: "Error",
    className: "text-red-600 dark:text-red-400",
    animate: false,
  },
  PENDING: {
    icon: Clock,
    label: "Pending",
    className: "text-gray-400 dark:text-gray-500",
    animate: false,
  },
  QUEUED: {
    icon: Clock,
    label: "Queued",
    className: "text-blue-600 dark:text-blue-400",
    animate: false,
  },
};

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function ProcessingStatusIcon({
  status,
  size = "md",
  showLabel = false,
  className,
}: ProcessingStatusIconProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon
        className={cn(
          sizeClasses[size],
          config.className,
          config.animate && "animate-spin"
        )}
      />
      {showLabel && (
        <span className={cn("text-sm font-medium", config.className)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
