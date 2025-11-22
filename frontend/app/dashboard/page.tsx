"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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
import { Globe, CheckCircle, Link as LinkIcon } from "lucide-react";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useGetApiV1Sites } from "@/lib/api/generated/queries/sites/sites";
import type { SiteResponse } from "@/lib/api/generated/models";

export default function DashboardPage() {
  // Protected route - redirects to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated } = useRequireAuth();

  // Fetch sites using generated hook
  const { data: sites = [], isLoading: isSitesLoading, error } = useGetApiV1Sites({
    query: {
      enabled: isAuthenticated,
    },
  });

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Verifying authentication" />;
  }

  if (isSitesLoading) {
    return (
      <div className="min-h-screen gradient-surface">
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
    <div className="min-h-screen gradient-surface">
      <DashboardHeader variant="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="My Dashboard"
          description="Manage your connected sites and monitor performance"
          action={
            <Link href="/onboarding">
              <Button variant="gradient" size="lg" className="px-8 py-4">
                <Plus className="w-5 h-5 mr-2" />
                Add New Site
              </Button>
            </Link>
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
              <StatsGrid
                stats={[
                  {
                    label: "Total Sites",
                    value: sites.length,
                    icon: Globe,
                    color: "blue",
                  },
                  {
                    label: "Active Sites",
                    value: sites.filter(s => s.crawlStatus === 'COMPLETED').length,
                    icon: CheckCircle,
                    color: "green",
                  },
                  {
                    label: "Total URLs",
                    value: sites.reduce((sum, s) => sum + (s.urlCount ?? 0), 0),
                    icon: LinkIcon,
                    color: "purple",
                  },
                ]}
                columns={3}
              />
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
            Connected Sites
          </motion.h2>

          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ErrorState
                title="Failed to load sites"
                message="Please try refreshing the page or check your connection."
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
                title="No sites connected yet"
                description="Get started by adding your first website to enable AI-powered conversations"
                action={{
                  label: "Add Your First Site",
                  href: "/onboarding",
                  icon: Plus,
                  variant: "gradient",
                }}
              />
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