"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useRequireUser } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  useGetBillingSubscriptions,
  useGetBillingPlans,
  usePostBillingSubscriptions,
  usePostBillingSubscriptionsSubscriptionIdPortal,
  usePostBillingSubscriptionsSubscriptionIdReactivate,
  getGetBillingSubscriptionsQueryKey,
} from "@/lib/api/generated/queries/subscriptions/subscriptions";
import { getGetSitesQueryKey, useGetSitesSiteId } from "@/lib/api/generated/queries/sites/sites";
import { getBackLinkConfig } from "@/lib/utils/navigation";
import { NoSiteSelected } from "@/components/account";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import type { Subscription } from "@/lib/api/generated/models";
import {
  CurrentSubscriptionCard,
  PlanCards,
  BillingInfoCard,
} from "@/components/subscriptions";

function SubscriptionsPageContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId");

  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireUser();

  const { data: site } = useGetSitesSiteId(siteId || "", {
    query: { enabled: isAuthenticated && !!siteId },
  });

  const { data: subscriptions = [], isLoading } = useGetBillingSubscriptions(
    { siteId: siteId || undefined },
    { query: { enabled: isAuthenticated && !!siteId } }
  );

  const { data: plans = [] } = useGetBillingPlans({
    query: { enabled: isAuthenticated },
  });

  const queryClient = useQueryClient();
  const portalMutation = usePostBillingSubscriptionsSubscriptionIdPortal();
  const createSubscriptionMutation = usePostBillingSubscriptions();
  const reactivateMutation = usePostBillingSubscriptionsSubscriptionIdReactivate();

  const siteSubscription = subscriptions.find((sub: Subscription) =>
    sub.status === "ACTIVE" || sub.status === "TRIAL"
  );

  const handleSubscribe = async (planType: string) => {
    if (!siteId) return;
    try {
      const result = await createSubscriptionMutation.mutateAsync({
        data: {
          siteId,
          planType: planType as "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL",
          returnUrl: "/account/subscriptions",
        },
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error("Failed to create subscription:", error);
    }
  };

  const handleManageSubscription = async (subscriptionId: string) => {
    try {
      const response = await portalMutation.mutateAsync({ subscriptionId });
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error("Failed to get portal URL:", error);
    }
  };

  const handleReactivate = async (subscriptionId: string) => {
    try {
      await reactivateMutation.mutateAsync({ subscriptionId });
      queryClient.invalidateQueries({ queryKey: getGetBillingSubscriptionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSitesQueryKey() });
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
    }
  };

  const backLink = getBackLinkConfig({
    siteId,
    siteName: site?.siteName,
    isAdmin: user?.isAdmin,
  });

  if (isAuthLoading) {
    return <AuthLoading message="Loading subscriptions" />;
  }

  if (!user) {
    return null;
  }

  if (!siteId) {
    return (
      <NoSiteSelected message="No site selected. Please access this page from a specific site to manage its subscription." />
    );
  }

  return (
    <div className="min-h-screen gradient-surface landing-grid-bg">
      <DashboardHeader
        variant="dashboard"
        showBackButton={true}
        backHref={backLink.href}
        showQuickActions={true}
        showNavigationSettings={false}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subscription for {site?.siteName || "Site"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your subscription plan for this site
            </p>
          </div>

          {siteSubscription && (
            <CurrentSubscriptionCard
              subscription={siteSubscription}
              onManage={() => handleManageSubscription(siteSubscription.id!)}
              onReactivate={() => handleReactivate(siteSubscription.id!)}
              isManaging={portalMutation.isPending}
              isReactivating={reactivateMutation.isPending}
            />
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {siteSubscription ? "Change Plan" : "Available Plans"}
            </h2>
            <PlanCards
              plans={plans}
              currentSubscription={siteSubscription}
              onSubscribe={handleSubscribe}
              isSubscribing={createSubscriptionMutation.isPending}
            />
          </div>

          <BillingInfoCard siteId={siteId} hasSubscription={!!siteSubscription} />
        </div>
      </main>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<AuthLoading message="Loading subscriptions" />}>
      <SubscriptionsPageContent />
    </Suspense>
  );
}
