import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteAvatar } from "@/components/site/site-avatar";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { type GetApiV1Sites200Item } from "@/lib/api/generated/models";

interface SiteCardProps {
  site: GetApiV1Sites200Item;
  index?: number;
  animated?: boolean;
}

export function SiteCard({ site, index = 0, animated = true }: SiteCardProps) {
  const status = getSiteStatus(site);

  const content = (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <SiteAvatar siteName={site.siteName} size="lg" animated={false} />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                {site.siteName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {site.urlCount} URLs indexed
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className={status.className}>
            {status.status}
          </Badge>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {status.detail}
          </p>

          <StatusIndicator
            status={site.crawlStatus || "PENDING"}
            animated={site.crawlStatus === "CRAWLING"}
            showLabel={true}
          />

          <Link href={`/sites/${site.id}`} className="block">
            <Button
              variant="outline"
              className="w-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Site
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  if (!animated) {
    return <div className="group h-full">{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
      whileHover={{ y: -2 }}
      className="group h-full"
    >
      {content}
    </motion.div>
  );
}

// Helper function to get site status
function getSiteStatus(site: GetApiV1Sites200Item) {
  if (site.subscription) {
    if (site.subscription.status === "TRIAL") {
      const trialEnd = new Date(site.subscription.trialEndsAt!);
      return {
        status: "Trial Active",
        detail: `Auto-renews on ${trialEnd.toLocaleDateString()}`,
        variant: "default" as const,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      };
    } else if (site.subscription.status === "ACTIVE") {
      const renewDate = site.subscription.currentPeriodEnd
        ? new Date(site.subscription.currentPeriodEnd)
        : new Date();
      return {
        status: "Active",
        detail: `Renews on ${renewDate.toLocaleDateString()}`,
        variant: "default" as const,
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      };
    } else if (site.subscription.status === "CANCELLED") {
      const endDate = site.subscription.currentPeriodEnd
        ? new Date(site.subscription.currentPeriodEnd)
        : new Date();
      return {
        status: "Cancelled",
        detail: `Expires on ${endDate.toLocaleDateString()}`,
        variant: "destructive" as const,
        className: "",
      };
    }
  }
  return {
    status: "Setup Required",
    detail: "Complete setup to activate",
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  };
}
