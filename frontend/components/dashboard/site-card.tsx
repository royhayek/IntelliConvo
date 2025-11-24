import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteAvatar } from "@/components/site/site-avatar";
import { type SiteResponse } from "@/lib/api/generated/models";

interface SiteCardProps {
  site: SiteResponse;
  index?: number;
  animated?: boolean;
}

export function SiteCard({ site, index = 0, animated = true }: SiteCardProps) {
  const displayStatus = getDisplayStatus(site);

  const content = (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <SiteAvatar siteName={site.siteName} imageUrl={site.faviconUrl ?? undefined} size="lg" animated={false} />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                {site.siteName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {site.urlCount} URLs indexed
              </p>
            </div>
          </div>
          <Badge
            variant={displayStatus.variant}
            className={`flex items-center space-x-2 -mt-1 ${displayStatus.badgeClass}`}
          >
            <motion.div
              animate={{
                scale: displayStatus.animate ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: displayStatus.animate ? Infinity : 0,
              }}
              className={`h-2 w-2 rounded-full ${displayStatus.dotColor}`}
            />
            <span>{displayStatus.label}</span>
          </Badge>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {displayStatus.detail}
          </p>

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

// Helper function to get display status - subscription status takes priority over crawl status
function getDisplayStatus(site: SiteResponse) {
  const subscriptionStatus = site.subscription?.status;

  // Subscription issues take priority
  if (subscriptionStatus === "CANCELLED") {
    return {
      label: "Cancelled",
      detail: "Subscription ended - reactivate to continue",
      variant: "destructive" as const,
      dotColor: "bg-red-500",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      animate: false,
    };
  }
  if (subscriptionStatus === "EXPIRED") {
    return {
      label: "Expired",
      detail: "Payment failed - update payment method",
      variant: "destructive" as const,
      dotColor: "bg-red-500",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      animate: false,
    };
  }

  // Check for pending cancellation (subscription still active but will cancel)
  if (site.subscription?.cancelAtPeriodEnd) {
    const endDate = site.subscription.currentPeriodEnd
      ? new Date(site.subscription.currentPeriodEnd)
      : new Date();
    return {
      label: "Cancelling",
      detail: `Ends on ${endDate.toLocaleDateString()}`,
      variant: "default" as const,
      dotColor: "bg-amber-500",
      badgeClass:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      animate: false,
    };
  }

  // Otherwise show crawl status with subscription context
  switch (site.crawlStatus) {
    case "READY":
      if (subscriptionStatus === "TRIAL") {
        const trialEnd = site.subscription?.trialEndsAt
          ? new Date(site.subscription.trialEndsAt)
          : null;
        return {
          label: "Trial Active",
          detail: trialEnd
            ? `Auto-renews on ${trialEnd.toLocaleDateString()}`
            : "Trial period active",
          variant: "default" as const,
          dotColor: "bg-blue-500",
          badgeClass:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          animate: false,
        };
      }
      if (subscriptionStatus === "ACTIVE") {
        const renewDate = site.subscription?.currentPeriodEnd
          ? new Date(site.subscription.currentPeriodEnd)
          : new Date();
        return {
          label: "Active",
          detail: `Renews on ${renewDate.toLocaleDateString()}`,
          variant: "default" as const,
          dotColor: "bg-green-500",
          badgeClass:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
          animate: false,
        };
      }
      return {
        label: "Active",
        detail: "Your AI assistant is ready",
        variant: "default" as const,
        dotColor: "bg-green-500",
        badgeClass:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        animate: false,
      };
    case "CRAWLING":
      return {
        label: "Scanning website...",
        detail: "We're discovering all the pages on your website",
        variant: "secondary" as const,
        dotColor: "bg-yellow-500",
        badgeClass:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        animate: true,
      };
    case "PROCESSING":
      return {
        label: "Setting up assistant...",
        detail: "We're setting up your AI assistant with your website content",
        variant: "secondary" as const,
        dotColor: "bg-indigo-500",
        badgeClass:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        animate: true,
      };
    case "PARTIAL":
      return {
        label: "Partially ready",
        detail: "Some pages couldn't be processed. Your assistant is active with available content",
        variant: "secondary" as const,
        dotColor: "bg-yellow-500",
        badgeClass:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        animate: false,
      };
    case "AWAITING_PAYMENT":
      return {
        label: "Awaiting activation",
        detail: "Complete your subscription to activate your assistant",
        variant: "secondary" as const,
        dotColor: "bg-amber-500",
        badgeClass:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        animate: false,
      };
    case "FAILED":
      return {
        label: "Setup failed",
        detail: "We couldn't access your website. Please check the URL and try again",
        variant: "destructive" as const,
        dotColor: "bg-red-500",
        badgeClass:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
        animate: false,
      };
    case "COMPLETED":
      return {
        label: "Analyzing content...",
        detail: "Website analysis is complete, preparing your assistant",
        variant: "default" as const,
        dotColor: "bg-green-500",
        badgeClass:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        animate: false,
      };
    case "PENDING":
    default:
      return {
        label: "Setting up...",
        detail: "Your website is being prepared for analysis",
        variant: "secondary" as const,
        dotColor: "bg-gray-500",
        badgeClass: "",
        animate: true,
      };
  }
}
