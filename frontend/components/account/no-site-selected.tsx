"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface NoSiteSelectedProps {
  message?: string;
}

export function NoSiteSelected({
  message = "No site selected. Please access this page from a specific site."
}: NoSiteSelectedProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <DashboardHeader
        variant="dashboard"
        showBackButton={true}
        showQuickActions={true}
        showNavigationSettings={false}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
