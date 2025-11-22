import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  urlStatusLabels,
  urlStatusAdminLabels,
  urlStatusVariants,
  type UrlEmbeddingStatus,
} from "@/lib/utils/status-labels";

// Legacy status types for backward compatibility
type LegacyUrlStatus = "active" | "inactive" | "excluded" | "crawling" | "error";

interface UrlStatusBadgeProps {
  // New prop: embedding status from backend
  embeddingStatus?: UrlEmbeddingStatus;
  // Legacy props for backward compatibility
  status?: LegacyUrlStatus;
  isActive?: boolean;
  isExcluded?: boolean;
  // Display options
  isAdmin?: boolean;
  className?: string;
  showTooltip?: boolean;
}

// Legacy status config for backward compatibility
const legacyStatusConfig = {
  active: {
    label: "Active",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  },
  inactive: {
    label: "Inactive",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800",
  },
  excluded: {
    label: "Excluded",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  crawling: {
    label: "Crawling",
    variant: "default" as const,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  error: {
    label: "Error",
    variant: "destructive" as const,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
};

export function UrlStatusBadge({
  embeddingStatus,
  status,
  isActive,
  isExcluded,
  isAdmin = false,
  className,
}: UrlStatusBadgeProps) {
  // If embeddingStatus is provided, use new status system
  if (embeddingStatus) {
    const labels = isAdmin ? urlStatusAdminLabels : urlStatusLabels;
    const variant = urlStatusVariants[embeddingStatus];

    return (
      <Badge
        variant={variant.variant}
        className={cn(variant.className, className)}
      >
        {labels[embeddingStatus]}
      </Badge>
    );
  }

  // Fall back to legacy status handling
  let finalStatus: LegacyUrlStatus = status || "inactive";
  if (isExcluded !== undefined || isActive !== undefined) {
    finalStatus = isExcluded ? "excluded" : isActive ? "active" : "inactive";
  }

  const config = legacyStatusConfig[finalStatus];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
