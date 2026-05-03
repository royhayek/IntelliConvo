"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Globe, CheckCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SiteCard } from "@/components/dashboard/site-card";
import { StatsGrid } from "@/components/ui/stats-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Tooltip } from "@/components/ui/tooltip";
import { useRequireUser } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useGetSites } from "@/lib/api/generated/queries/sites/sites";
import { EmailVerificationAlert } from "@/components/ui/email-verification-alert";
import { SubscriptionAlert } from "@/components/ui/subscription-alert";
import { computeDashboardStats } from "@/lib/utils/dashboard-stats";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  // Protected route - redirects to login if not authenticated, admins to admin portal
  const { isLoading: isAuthLoading, isAuthenticated } = useRequireUser();

  // Get user from auth store to check email verification status
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Check if email is not verified
  const isEmailUnverified = user && !user.emailVerified;

  // Fetch sites using generated hook
  const { data: sites = [], isLoading: isSitesLoading, error } = useGetSites({
    query: {
      enabled: isAuthenticated,
    },
  });

  // Compute dashboard stats
  const dashboardStats = useMemo(
    () =>
      computeDashboardStats(sites, {
        totalSites: Globe,
        activeSites: CheckCircle,
        totalUrls: LinkIcon,
      }),
    [sites]
  );

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading />;
  }

  // If not authenticated, useRequireUser will redirect to login
  // Don't show dashboard UI while redirecting
  if (!isAuthenticated) {
    return <AuthLoading />;
  }

  if (isSitesLoading) {
    return (
      <div className="min-h-screen gradient-surface landing-grid-bg">
        <DashboardHeader variant="dashboard" />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <Skeleton className="h-12 w-64 mb-3" />
            <Skeleton className="h-6 w-96" />
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-14 w-14 rounded-2xl" />
                      <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface landing-grid-bg">
      <DashboardHeader variant="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Email Verification Alert */}
        <EmailVerificationAlert className="mb-6" />

        {/* Subscription Alert for cancelled/expiring subscriptions */}
        {sites.length > 0 && <SubscriptionAlert sites={sites} className="mb-6" />}
        <PageHeader
          title={t("dashboard.title")}
          description={t("dashboard.description")}
          action={
            isEmailUnverified ? (
              <Tooltip
                content={t("dashboard.verifyEmailTooltip")}
                position="bottom"
              >
                <div>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="px-8 py-4"
                    disabled
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t("dashboard.addNewSite")}
                  </Button>
                </div>
              </Tooltip>
            ) : (
              <Link href="/onboarding">
                <Button variant="gradient" size="lg" className="px-8 py-4">
                  <Plus className="w-5 h-5 mr-2" />
                  {t("dashboard.addNewSite")}
                </Button>
              </Link>
            )
          }
        />

          {/* Stats Overview */}
          {sites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10"
            >
              <StatsGrid stats={dashboardStats} columns={3} />
            </motion.div>
          )}

        {/* Connected Sites Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="my-8"
        >
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-8"
          >
            {t("dashboard.connectedSites")}
          </motion.h2>

          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ErrorState
                title={t("dashboard.failedToLoad")}
                message={t("dashboard.failedToLoadDesc")}
                onRetry={() => window.location.reload()}
              />
            </motion.div>
          ) : sites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <EmptyState
                icon={Plus}
                title={t("dashboard.noSites")}
                description={t("dashboard.noSitesDesc")}
                action={
                  isEmailUnverified
                    ? undefined
                    : {
                        label: t("dashboard.addFirstSite"),
                        href: "/onboarding",
                        icon: Plus,
                        variant: "gradient",
                      }
                }
              />
              {isEmailUnverified && (
                <div className="flex justify-center mt-6">
                  <Tooltip
                    content={t("dashboard.verifyEmailTooltip")}
                    position="top"
                  >
                    <Button variant="gradient" size="lg" disabled>
                      <Plus className="w-5 h-5 mr-2" />
                      {t("dashboard.addFirstSite")}
                    </Button>
                  </Tooltip>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site, index) => (
                <SiteCard key={site.id} site={site} index={index} />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}