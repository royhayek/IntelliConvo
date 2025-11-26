"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useRequireUser } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  useGetApiV1BillingHistory,
  useGetApiV1BillingSummary,
  getApiV1BillingReceiptsTransactionId,
} from "@/lib/api/generated/queries/billing/billing";
import { useGetApiV1SitesSiteId } from "@/lib/api/generated/queries/sites/sites";
import { getBackLinkConfig } from "@/lib/utils/navigation";
import { NoSiteSelected } from "@/components/account";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BillingSummaryStats } from "@/components/billing/billing-summary-stats";
import { ActiveSubscriptionsCard } from "@/components/billing/active-subscriptions-card";
import { TransactionHistoryCard } from "@/components/billing/transaction-history-card";
import { BillingHelpCard } from "@/components/billing/billing-help-card";
import { TrialStatusBanner } from "@/components/site/trial-status-banner";

function BillingHistoryPageContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId");
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireUser();

  const { data: site } = useGetApiV1SitesSiteId(siteId || "", {
    query: { enabled: isAuthenticated && !!siteId },
  });

  const { data: billingData, isLoading } = useGetApiV1BillingHistory(
    { limit: "50", siteId: siteId || undefined },
    { query: { enabled: isAuthenticated && !!siteId } }
  );

  const { data: billingSummary } = useGetApiV1BillingSummary(
    { siteId: siteId || undefined },
    { query: { enabled: isAuthenticated && !!siteId } }
  );

  const handleViewReceipt = async (transactionId: string) => {
    setLoadingReceiptId(transactionId);
    try {
      const response = await getApiV1BillingReceiptsTransactionId(transactionId);
      // Open the Stripe hosted receipt in a new tab
      window.open(response.receiptUrl, "_blank");
    } catch {
      toast.error("Failed to load receipt");
    } finally {
      setLoadingReceiptId(null);
    }
  };

  const backLink = getBackLinkConfig({
    siteId,
    siteName: site?.siteName,
    isAdmin: user?.isAdmin,
  });

  if (isAuthLoading) {
    return <AuthLoading message="Loading billing information" />;
  }

  if (!user) {
    return null;
  }

  if (!siteId) {
    return (
      <NoSiteSelected message="No site selected. Please access this page from a specific site to view its billing history." />
    );
  }

  const transactions = billingData?.transactions || [];
  const summary = billingData?.summary || {
    totalAmount: 0,
    totalTransactions: 0,
    statusCounts: { paid: 0, pending: 0, failed: 0 },
  };
  const pagination = billingData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  };

  const totalPaid = summary.totalAmount ?? 0;
  const statusCounts = summary.statusCounts || { paid: 0, pending: 0, failed: 0 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
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
              Billing History for {site?.siteName || "Site"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View payment history and invoices for this site
            </p>
          </div>

          {/* Trial Status */}
          <TrialStatusBanner siteId={siteId} />

          <BillingSummaryStats
            totalPaid={totalPaid}
            totalTransactions={summary.totalTransactions}
            statusCounts={statusCounts}
          />

          <ActiveSubscriptionsCard
            siteId={siteId}
            subscriptions={billingSummary?.activeSubscriptions}
            upcomingCharges={billingSummary?.upcomingCharges}
          />

          <TransactionHistoryCard
            transactions={transactions}
            pagination={pagination}
            isLoading={isLoading}
            onViewReceipt={handleViewReceipt}
            loadingReceiptId={loadingReceiptId}
          />

          <BillingHelpCard />
        </div>
      </main>
    </div>
  );
}

export default function BillingHistoryPage() {
  return (
    <Suspense fallback={<AuthLoading message="Loading billing information" />}>
      <BillingHistoryPageContent />
    </Suspense>
  );
}
