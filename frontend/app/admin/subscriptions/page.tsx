"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import {
  useGetApiV1AdminSubscriptions,
  useDeleteApiV1AdminSubscriptionsSubscriptionId,
  usePostApiV1AdminSubscriptionsSubscriptionIdCancel,
  usePostApiV1AdminSubscriptionsSubscriptionIdReactivate,
  getGetApiV1AdminSubscriptionsQueryKey,
} from "@/lib/api/generated/queries/admin-subscriptions/admin-subscriptions";
import {
  useGetApiV1AdminStatsSubscriptions,
  getGetApiV1AdminStatsSubscriptionsQueryKey,
} from "@/lib/api/generated/queries/admin/admin";
import type {
  AdminSubscription,
  GetApiV1AdminSubscriptionsStatus,
  GetApiV1AdminSubscriptionsPlanType,
} from "@/lib/api/generated/models";
import {
  SubscriptionsStats,
  SubscriptionsFilters,
  SubscriptionsTable,
} from "@/components/admin/subscriptions";

interface SubscriptionStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byPlanType: { planType: string; count: number }[];
  expiringTrialsNext7Days: number;
}

export default function AdminSubscriptionsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [planType, setPlanType] = useState(searchParams.get("planType") || "all");
  const [userId, setUserId] = useState<string | null>(searchParams.get("userId") || null);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteSubscription, setDeleteSubscription] = useState<AdminSubscription | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const queryParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(userId && { userId }),
    ...(status !== "all" && { status: status as GetApiV1AdminSubscriptionsStatus }),
    ...(planType !== "all" && { planType: planType as GetApiV1AdminSubscriptionsPlanType }),
  };

  const { data: subscriptionsData, isLoading, error } = useGetApiV1AdminSubscriptions(queryParams);
  const { data: statsData } = useGetApiV1AdminStatsSubscriptions();

  const stats = statsData?.data as SubscriptionStats | undefined;
  const data = subscriptionsData?.data;

  const deleteMutation = useDeleteApiV1AdminSubscriptionsSubscriptionId({
    mutation: {
      onSuccess: () => {
        setDeleteSubscription(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSubscriptionsQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsSubscriptionsQueryKey() });
      },
    },
  });

  const cancelMutation = usePostApiV1AdminSubscriptionsSubscriptionIdCancel({
    mutation: {
      onSuccess: () => {
        setActionLoadingId(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSubscriptionsQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsSubscriptionsQueryKey() });
      },
      onError: () => setActionLoadingId(null),
    },
  });

  const reactivateMutation = usePostApiV1AdminSubscriptionsSubscriptionIdReactivate({
    mutation: {
      onSuccess: () => {
        setActionLoadingId(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSubscriptionsQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsSubscriptionsQueryKey() });
      },
      onError: () => setActionLoadingId(null),
    },
  });

  const handleSearch = () => setPage(1);
  const handleDelete = () => {
    if (!deleteSubscription) return;
    deleteMutation.mutate({ subscriptionId: deleteSubscription.id });
  };
  const handleCancel = (subscription: AdminSubscription) => {
    setActionLoadingId(subscription.id);
    cancelMutation.mutate({ subscriptionId: subscription.id });
  };
  const handleReactivate = (subscription: AdminSubscription) => {
    setActionLoadingId(subscription.id);
    reactivateMutation.mutate({ subscriptionId: subscription.id });
  };

  const errorMessage = error ? "Failed to fetch subscriptions" : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Subscriptions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage user subscriptions and plans
          </p>
        </div>
      </div>

      {stats && <SubscriptionsStats stats={stats} />}

      <SubscriptionsFilters
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        userId={userId}
        onUserChange={(id) => { setUserId(id); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        planType={planType}
        onPlanTypeChange={(v) => { setPlanType(v); setPage(1); }}
      />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <SubscriptionsTable
          subscriptions={data.subscriptions}
          pagination={data.pagination}
          onPageChange={setPage}
          actionLoadingId={actionLoadingId}
          onCancel={handleCancel}
          onReactivate={handleReactivate}
          onDelete={setDeleteSubscription}
        />
      ) : null}

      <DeleteConfirmationDialog
        open={!!deleteSubscription}
        onOpenChange={(open) => !open && setDeleteSubscription(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Subscription"
        description={`Are you sure you want to delete the subscription for ${deleteSubscription?.site?.siteName}? This action cannot be undone.`}
      />
    </div>
  );
}
