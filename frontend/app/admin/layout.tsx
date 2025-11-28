"use client";

import { useState } from "react";
import { useRequireAdmin } from "@/lib/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAdmin } = useRequireAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render anything if not admin (redirect will happen via hook)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-h-screen pt-20 pb-6 px-4 md:px-6 lg:pl-72">
        {children}
      </main>
    </div>
  );
}
