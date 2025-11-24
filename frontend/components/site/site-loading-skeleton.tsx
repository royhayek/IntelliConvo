"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface SiteLoadingSkeletonProps {
  siteId: string;
}

export function SiteLoadingSkeleton({ siteId }: SiteLoadingSkeletonProps) {
  return (
    <div className="min-h-screen gradient-surface">
      <DashboardHeader variant="site" siteId={siteId} showBackButton={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
