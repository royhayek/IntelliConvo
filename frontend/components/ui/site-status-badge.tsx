import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  siteStatusLabels,
  siteStatusAdminLabels,
  siteStatusVariants,
  siteStatusDescriptions,
  isSiteProcessing,
  type CrawlStatus,
} from "@/lib/utils/status-labels";

interface SiteStatusBadgeProps {
  status: CrawlStatus;
  isAdmin?: boolean;
  showDescription?: boolean;
  showSpinner?: boolean;
  className?: string;
}

export function SiteStatusBadge({
  status,
  isAdmin = false,
  showSpinner = true,
  className,
}: SiteStatusBadgeProps) {
  const labels = isAdmin ? siteStatusAdminLabels : siteStatusLabels;
  const variant = siteStatusVariants[status];
  const isProcessing = isSiteProcessing(status);

  return (
    <Badge
      variant={variant.variant}
      className={cn(
        variant.className,
        "inline-flex items-center gap-1.5",
        className
      )}
      title={siteStatusDescriptions[status]}
    >
      {showSpinner && isProcessing && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {labels[status]}
    </Badge>
  );
}
