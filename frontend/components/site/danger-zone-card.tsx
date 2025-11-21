import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DangerZoneCardProps {
  siteUrl: string;
  hasActiveSubscription: boolean;
  onDelete: () => void;
  isDeleting?: boolean;
  className?: string;
}

export function DangerZoneCard({
  siteUrl,
  hasActiveSubscription,
  onDelete,
  isDeleting = false,
  className,
}: DangerZoneCardProps) {
  return (
    <Card className={cn("border-red-200 dark:border-red-800", className)}>
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You can delete your site and all associated data so long as you do not have any active subscriptions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{siteUrl}</p>
            {hasActiveSubscription && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                Active Subscription
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            disabled={hasActiveSubscription || isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Site"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
