"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SiteNavigationSidebar } from "@/components/site/site-navigation-sidebar";
import { SiteLoadingSkeleton } from "@/components/site/site-loading-skeleton";
import { SiteNotFound } from "@/components/site/site-not-found";
import { SubscriptionBlockedMessage } from "@/components/site/subscription-blocked-message";
import { SiteHeader } from "@/components/site/site-header";
import { AnimatedTabContent } from "@/components/site/animated-tab-content";
import { useUIStore } from "@/lib/store";
import { useRequireUser } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import { useSiteSocket } from "@/lib/hooks/useSiteSocket";
import {
  useGetApiV1SitesSiteId,
  getGetApiV1SitesSiteIdQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import { getDisplayStatus } from "@/lib/utils/status-labels";
import { SITE_TABS } from "@/lib/constants/site-tabs";
import type { SiteResponse } from "@/lib/api/generated/models";
import type { CrawlStatus, SubscriptionStatus } from "@/lib/utils/status-labels";

import { OverviewTab } from "@/components/site/overview-tab";
import { SitemapTab } from "@/components/site/sitemap-tab";
import { KnowledgeTab } from "@/components/site/knowledge-tab";
import { ConversationsTab } from "@/components/site/conversations-tab";
import { PreferencesTab } from "@/components/site/preferences-tab";
import { WidgetTab } from "@/components/site/widget-tab";
import { PlaygroundTab } from "@/components/site/playground-tab";
import { HostsTab } from "@/components/site/hosts-tab";
import { TrialStatusBanner } from "@/components/site/trial-status-banner";

const TAB_COMPONENTS: Record<string, React.ComponentType<{ site: SiteResponse }>> = {
  overview: OverviewTab,
  sitemap: SitemapTab,
  knowledge: KnowledgeTab,
  conversations: ConversationsTab,
  preferences: PreferencesTab,
  hosts: HostsTab,
  widget: WidgetTab,
  playground: PlaygroundTab,
};

export default function SiteManagePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const siteId = params.siteId as string;

  const activeTab = searchParams.get("tab") || "overview";

  const setActiveTab = useCallback(
    (tab: string) => {
      router.push(`/sites/${siteId}?tab=${tab}`, { scroll: false });
    },
    [router, siteId]
  );

  const { isLoading: isAuthLoading, isAuthenticated } = useRequireUser();
  const { navigationLayout } = useUIStore();
  const queryClient = useQueryClient();

  // Force horizontal layout on mobile/tablet devices (< 1024px)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };

    // Check on mount
    checkIfMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const effectiveLayout = isMobileOrTablet ? 'horizontal' : navigationLayout;

  const { data: site, isLoading: isSiteLoading } = useGetApiV1SitesSiteId(
    siteId,
    {
      query: {
        enabled: isAuthenticated && !!siteId,
        refetchOnMount: true,
        staleTime: 0,
      },
    }
  );

  const handleCrawlStatusUpdate = useCallback(
    (update: { siteId: string; crawlStatus: string }) => {
      if (update.siteId !== siteId) return;

      queryClient.setQueryData(
        getGetApiV1SitesSiteIdQueryKey(siteId),
        (oldData: SiteResponse | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, crawlStatus: update.crawlStatus };
        }
      );
    },
    [siteId, queryClient]
  );

  useSiteSocket({
    siteId: isAuthenticated ? siteId : null,
    onCrawlStatusUpdate: handleCrawlStatusUpdate,
  });

  if (isAuthLoading) {
    return <AuthLoading />;
  }

  // If not authenticated, useRequireUser will redirect to login
  // Don't show site-specific UI while redirecting
  if (!isAuthenticated) {
    return <AuthLoading />;
  }

  if (isSiteLoading) {
    return <SiteLoadingSkeleton siteId={siteId} />;
  }

  if (!site) {
    return <SiteNotFound />;
  }

  const subscriptionStatus = site.subscription?.status as SubscriptionStatus;
  const isSubscriptionBlocked =
    subscriptionStatus === "CANCELLED" || subscriptionStatus === "EXPIRED";
  const isExpired = subscriptionStatus === "EXPIRED";

  const displayStatus = getDisplayStatus(
    subscriptionStatus,
    site.crawlStatus as CrawlStatus
  );

  const renderTabContents = (site: SiteResponse) => (
    <>
      {SITE_TABS.map((tab) => {
        const TabComponent = TAB_COMPONENTS[tab.id];
        return (
          <AnimatedTabContent key={tab.id} value={tab.id}>
            <TabComponent site={site} />
          </AnimatedTabContent>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen gradient-surface">
      <DashboardHeader
        variant="site"
        siteName={site?.siteName}
        siteId={siteId}
        showBackButton={true}
        showNavigation={false}
        showQuickActions={false}
        showNavigationSettings={true}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 pt-4 sm:pt-4">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: site.siteName, href: `/sites/${siteId}` },
          ]}
        />
      </div>

      <SiteHeader site={site} displayStatus={displayStatus} />

      {/* Trial Status Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        <TrialStatusBanner
          siteId={siteId}
          onUpgrade={() => router.push(`/account/subscriptions?siteId=${siteId}`)}
        />
      </div>

      <main
        className={
          effectiveLayout === "vertical"
            ? ""
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8"
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isSubscriptionBlocked ? (
            <SubscriptionBlockedMessage siteId={siteId} isExpired={isExpired} />
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-8"
            >
              {effectiveLayout === "vertical" ? (
                <div className="flex">
                  <TabsList className="hidden">
                    {SITE_TABS.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="w-64 flex-shrink-0 pl-4 sm:pl-2 lg:pl-4 pt-2">
                    <SiteNavigationSidebar
                      tabs={SITE_TABS}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-4 sm:pr-6 lg:pr-8 pt-2 pb-8">
                    <div className="max-w-7xl">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass-effect rounded-3xl p-8 shadow-soft"
                      >
                        {renderTabContents(site)}
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
                    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-sm border border-gray-200/50 dark:border-slate-700/50 overflow-x-auto"
                  >
                    <TabsList className="flex flex-nowrap w-max bg-transparent p-0.5 sm:p-1 gap-0.5 sm:gap-1">
                      {SITE_TABS.map((tab, index) => {
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
                              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-700/80 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all whitespace-nowrap"
                            >
                              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
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
                    className="glass-effect rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-soft"
                  >
                    {renderTabContents(site)}
                  </motion.div>
                </>
              )}
            </Tabs>
          )}
        </motion.div>
      </main>
    </div>
  );
}
