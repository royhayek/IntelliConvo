"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useAuthStore } from "@/lib/store";
import { useGetApiSites } from "@/lib/api/generated/queries/sites/sites";
import { type GetApiSites200Item } from "@/lib/api/generated/models";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Fetch sites using generated hook
  const { data: sites = [], isLoading, error } = useGetApiSites({
    query: {
      enabled: isAuthenticated,
    },
  });


  const getSiteStatus = (site: GetApiSites200Item) => {
    if (site.subscription) {
      if (site.subscription.status === "TRIAL") {
        const trialEnd = new Date(site.subscription.trialEndsAt!);
        return {
          status: "Trial Active",
          detail: `Auto-renews on ${trialEnd.toLocaleDateString()}`,
          color: "bg-blue-100 text-blue-800",
        };
      } else if (site.subscription.status === "ACTIVE") {
        const renewDate = site.subscription.currentPeriodEnd ? new Date(site.subscription.currentPeriodEnd) : new Date();
        return {
          status: "Active",
          detail: `Renews on ${renewDate.toLocaleDateString()}`,
          color: "bg-green-100 text-green-800",
        };
      } else if (site.subscription.status === "CANCELLED") {
        const endDate = site.subscription.currentPeriodEnd ? new Date(site.subscription.currentPeriodEnd) : new Date();
        return {
          status: "Cancelled",
          detail: `Expires on ${endDate.toLocaleDateString()}`,
          color: "bg-red-100 text-red-800",
        };
      }
    }
    return {
      status: "Setup Required",
      detail: "Complete setup to activate",
      color: "bg-yellow-100 text-yellow-800",
    };
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
          ></motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600"
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface">
      <DashboardHeader variant="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                My Dashboard
              </h1>
              <p className="mt-3 text-xl text-gray-600">
                Manage your connected sites and monitor performance
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/onboarding">
                <Button variant="gradient" size="lg" className="px-8 py-4">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Site
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats Overview */}
          {sites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">{sites.length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Sites</p>
                    <p className="text-2xl font-semibold text-gray-900">{sites.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-green-600">{sites.filter(s => s.crawlStatus === 'COMPLETED').length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Sites</p>
                    <p className="text-2xl font-semibold text-gray-900">{sites.filter(s => s.crawlStatus === 'COMPLETED').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-purple-600">{sites.reduce((sum, s) => sum + (s.urlCount ?? 0), 0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total URLs</p>
                    <p className="text-2xl font-semibold text-gray-900">{sites.reduce((sum, s) => sum + (s.urlCount ?? 0), 0)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Connected Sites Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl font-bold text-gray-900 mb-8"
          >
            Connected Sites
          </motion.h2>

          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect border-2 border-red-200 bg-red-50/50 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load sites</h3>
              <p className="text-red-600">Please try refreshing the page or check your connection.</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </motion.div>
          ) : sites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="glass-effect border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
                className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6"
              >
                <Plus className="h-10 w-10 text-indigo-600" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                No sites connected yet
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
              >
                Get started by adding your first website to enable AI-powered conversations
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Link href="/onboarding">
                  <Button variant="gradient" size="lg" className="px-8 py-4">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Site
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site, index) => {
                const status = getSiteStatus(site);
                return (
                  <motion.div
                    key={site.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/50 h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                          >
                            <span className="text-xl font-bold text-white">
                              {site.siteName.charAt(0).toUpperCase()}
                            </span>
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {site.siteName}
                            </h3>
                            <p className="text-sm text-gray-500">{site.urlCount} URLs indexed</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} shadow-sm`}>
                          {status.status}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{status.detail}</p>

                        <div className="flex items-center space-x-3">
                          <motion.div
                            animate={{
                              scale: site.crawlStatus === 'CRAWLING' ? [1, 1.2, 1] : 1,
                            }}
                            transition={{
                              duration: 2,
                              repeat: site.crawlStatus === 'CRAWLING' ? Infinity : 0,
                            }}
                            className={`h-3 w-3 rounded-full ${
                              site.crawlStatus === 'COMPLETED' ? 'bg-green-500' :
                              site.crawlStatus === 'CRAWLING' ? 'bg-yellow-500' :
                              site.crawlStatus === 'FAILED' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}
                          ></motion.div>
                          <span className="text-sm font-medium text-gray-700">
                            {site.crawlStatus === 'COMPLETED' ? 'Up to date' :
                             site.crawlStatus === 'CRAWLING' ? 'Updating...' :
                             site.crawlStatus === 'FAILED' ? 'Update failed' :
                             'Pending update'}
                          </span>
                        </div>

                        <Link href={`/sites/${site.id}`} className="block">
                          <Button variant="outline" className="w-full group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Site
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}