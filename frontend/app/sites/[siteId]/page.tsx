"use client";

import { useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useAuthStore } from "@/lib/store";
import { useGetApiSitesSiteId } from "@/lib/api/generated/queries/sites/sites";

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
  const { isAuthenticated } = useAuthStore();

  // Fetch site using generated hook
  const { data: site, isLoading } = useGetApiSitesSiteId(siteId, {
    query: {
      enabled: isAuthenticated && !!siteId,
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);


  if (!isAuthenticated) {
    return null;
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
            Loading site dashboard...
          </motion.p>
        </motion.div>
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
            className="h-20 w-20 rounded-3xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-6"
          >
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h8m-8 0H4" />
            </svg>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Site not found</h2>
          <p className="text-lg text-gray-600 mb-8">The site you're looking for doesn't exist or has been removed.</p>
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
      />

      {/* Site Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect border-b border-white/10 shadow-soft"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <span className="text-2xl font-bold text-white">
                  {site.siteName.charAt(0).toUpperCase()}
                </span>
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {site.siteName}
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
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
              <div className="glass-effect rounded-xl px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">{site.urlCount} URLs</span>
                </div>
              </div>

              <div className="glass-effect rounded-xl px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Updated {new Date(site.lastCrawledAt || site.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {site.subscription && (
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                    site.subscription.status === "TRIAL" ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800" :
                    site.subscription.status === "ACTIVE" ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800" :
                    "bg-gradient-to-r from-red-100 to-red-200 text-red-800"
                  }`}
                >
                  {site.subscription.status === "TRIAL" ? "✨ Trial" :
                   site.subscription.status === "ACTIVE" ? "✅ Active" : "❌ Expired"}
                </motion.span>
              )}

              <motion.div
                animate={{
                  scale: site.crawlStatus === "CRAWLING" ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: site.crawlStatus === "CRAWLING" ? Infinity : 0,
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                  site.crawlStatus === "COMPLETED" ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800" :
                  site.crawlStatus === "CRAWLING" ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800" :
                  site.crawlStatus === "FAILED" ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800" :
                  "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
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
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue={initialTab} className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-gray-200/50 overflow-x-auto"
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
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
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
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}