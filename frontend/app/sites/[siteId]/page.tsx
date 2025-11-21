"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Settings,
  Globe,
  FileText,
  MessageSquare,
  Sliders,
  Code,
  Play,
  Shield,
  Activity,
  Clock,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SiteAvatar } from "@/components/site/site-avatar";
import { SiteNavigationSidebar } from "@/components/site/site-navigation-sidebar";
import { useUIStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useGetApiV1SitesSiteId } from "@/lib/api/generated/queries/sites/sites";

// Tab components (these would be separate files in a real app)
import { OverviewTab } from "@/components/site/overview-tab";
import { SitemapTab } from "@/components/site/sitemap-tab";
import { KnowledgeTab } from "@/components/site/knowledge-tab";
import { ConversationsTab } from "@/components/site/conversations-tab";
import { PreferencesTab } from "@/components/site/preferences-tab";
import { WidgetTab } from "@/components/site/widget-tab";
import { PlaygroundTab } from "@/components/site/playground-tab";
import { HostsTab } from "@/components/site/hosts-tab";

export default function SiteManagePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const siteId = params.siteId as string;
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Protected route - redirects to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated } = useRequireAuth();
  const { navigationLayout } = useUIStore();

  // Fetch site using generated hook
  const { data: site, isLoading: isSiteLoading } = useGetApiV1SitesSiteId(siteId, {
    query: {
      enabled: isAuthenticated && !!siteId,
    },
  });

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== initialTab) {
      const newUrl = `/sites/${siteId}?tab=${activeTab}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeTab, siteId, router, initialTab]);

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Verifying authentication" />;
  }

  if (isSiteLoading) {
    return (
      <div className="min-h-screen gradient-surface">
        <DashboardHeader variant="site" showBackButton={true} />
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

  if (!site) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-effect rounded-3xl p-12 shadow-soft"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="h-20 w-20 rounded-3xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto mb-6"
          >
            <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h8m-8 0H4" />
            </svg>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Site not found</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">The site you're looking for doesn't exist or has been removed.</p>
          <Link href="/dashboard">
            <Button variant="gradient" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Settings },
    { id: "sitemap", label: "Sitemap & URLs", icon: Globe },
    { id: "knowledge", label: "PDFs & Knowledge", icon: FileText },
    { id: "conversations", label: "Conversations", icon: MessageSquare },
    { id: "preferences", label: "Site Preferences", icon: Sliders },
    { id: "hosts", label: "Access & Security", icon: Shield },
    { id: "widget", label: "Widget & Button", icon: Code },
    { id: "playground", label: "Playground", icon: Play },
  ];

  return (
    <div className="min-h-screen gradient-surface">
      <DashboardHeader
        variant="site"
        siteName={site?.siteName}
        showBackButton={true}
        showNavigation={false}
        showQuickActions={false}
        showNavigationSettings={true}
      />

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: site.siteName, href: `/sites/${siteId}` },
          ]}
        />
      </div>

      {/* Site Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <SiteAvatar
                siteName={site.siteName}
                size="xl"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {site.siteName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                  <Globe className="w-4 h-4 mr-1" />
                  {site.siteUrl}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* Stats Cards */}
              <div className="glass-effect rounded-xl px-4 py-2 border border-white/20 dark:border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{site.urlCount} URLs</span>
                </div>
              </div>

              <div className="glass-effect rounded-xl px-4 py-2 border border-white/20 dark:border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Updated {new Date(site.lastCrawledAt || site.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {site.subscription && (
                <Badge
                  variant={
                    site.subscription.status === "ACTIVE" ? "default" :
                    site.subscription.status === "TRIAL" ? "secondary" : "destructive"
                  }
                  className={`px-4 py-2 text-sm ${
                    site.subscription.status === "TRIAL" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                    site.subscription.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" : ""
                  }`}
                >
                  {site.subscription.status === "TRIAL" ? "✨ Trial" :
                   site.subscription.status === "ACTIVE" ? "✅ Active" : "❌ Expired"}
                </Badge>
              )}

              <Badge
                variant={
                  site.crawlStatus === "COMPLETED" ? "default" :
                  site.crawlStatus === "FAILED" ? "destructive" : "secondary"
                }
                className={`flex items-center space-x-2 text-sm ${
                  site.crawlStatus === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" :
                  site.crawlStatus === "CRAWLING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" : ""
                }`}
              >
                <motion.div
                  animate={{
                    scale: site.crawlStatus === "CRAWLING" ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: site.crawlStatus === "CRAWLING" ? Infinity : 0,
                  }}
                  className={`h-2 w-2 rounded-full ${
                    site.crawlStatus === "COMPLETED" ? "bg-green-500" :
                    site.crawlStatus === "CRAWLING" ? "bg-yellow-500" :
                    site.crawlStatus === "FAILED" ? "bg-red-500" :
                    "bg-gray-500"
                  }`}
                ></motion.div>
                <span>
                  {site.crawlStatus === "COMPLETED" ? "Up to date" :
                   site.crawlStatus === "CRAWLING" ? "Updating..." :
                   site.crawlStatus === "FAILED" ? "Update failed" :
                   "Pending"}
                </span>
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className={navigationLayout === "vertical" ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8"}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {navigationLayout === "vertical" ? (
              <div className="flex gap-8">
                {/* Hidden TabsList for accessibility */}
                <TabsList className="hidden">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Fixed Sidebar on the left */}
                <div className="w-64 flex-shrink-0 pl-4 sm:pl-6 lg:pl-8 pt-2">
                  <SiteNavigationSidebar
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                {/* Content area with same max-width as horizontal layout */}
                <div className="flex-1 min-w-0 pr-4 sm:pr-6 lg:pr-8 pt-2 pb-8">
                  <div className="max-w-7xl">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="glass-effect rounded-3xl p-8 shadow-soft"
                    >
                    <TabsContent value="overview" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <OverviewTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="sitemap" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <SitemapTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="knowledge" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <KnowledgeTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="conversations" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <ConversationsTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <PreferencesTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="hosts" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <HostsTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="widget" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <WidgetTab site={site} />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="playground" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <PlaygroundTab site={site} />
                      </motion.div>
                    </TabsContent>
                    </motion.div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto"
                >
                  <TabsList className="flex flex-nowrap w-max bg-transparent p-1 gap-1">
                    {tabs.map((tab, index) => {
                      const Icon = tab.icon;
                      return (
                        <motion.div
                          key={tab.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                        >
                          <TabsTrigger
                            value={tab.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-700/80 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                          >
                            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{tab.label}</span>
                          </TabsTrigger>
                        </motion.div>
                      );
                    })}
                  </TabsList>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-effect rounded-3xl p-8 shadow-soft"
                >
                  <TabsContent value="overview" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <OverviewTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="sitemap" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <SitemapTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="knowledge" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <KnowledgeTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="conversations" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ConversationsTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <PreferencesTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="hosts" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <HostsTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="widget" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <WidgetTab site={site} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="playground" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <PlaygroundTab site={site} />
                    </motion.div>
                  </TabsContent>
                </motion.div>
              </>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}