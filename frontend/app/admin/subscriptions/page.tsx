"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";

// Import generated hooks
import {
  useGetApiV1AdminSubscriptions,
  useDeleteApiV1AdminSubscriptionsSubscriptionId,
  usePostApiV1AdminSubscriptionsSubscriptionIdCancel,
  usePostApiV1AdminSubscriptionsSubscriptionIdReactivate,
  getGetApiV1AdminSubscriptionsQueryKey,
} from "@/lib/api/generated/queries/admin-subscriptions/admin-subscriptions";
import { useGetApiV1AdminStatsSubscriptions } from "@/lib/api/generated/queries/admin/admin";

// Import generated types
import type {
  AdminSubscription,
  GetApiV1AdminSubscriptionsStatus,
  GetApiV1AdminSubscriptionsPlanType,
} from "@/lib/api/generated/models";

// Define stats interface for the stats response (since it's typed as unknown)
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
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteSubscription, setDeleteSubscription] = useState<AdminSubscription | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Build query params
  const queryParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(status !== "all" && { status: status as GetApiV1AdminSubscriptionsStatus }),
    ...(planType !== "all" && { planType: planType as GetApiV1AdminSubscriptionsPlanType }),
  };

  // Fetch subscriptions using generated hook
  const {
    data: subscriptionsData,
    isLoading,
    error,
  } = useGetApiV1AdminSubscriptions(queryParams);

  // Fetch subscription stats using generated hook
  const { data: statsData } = useGetApiV1AdminStatsSubscriptions();

  // Cast stats data to proper type (since API returns unknown)
  const stats = statsData?.data as SubscriptionStats | undefined;
  const data = subscriptionsData?.data;

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminSubscriptionsSubscriptionId({
    mutation: {
      onSuccess: () => {
        setDeleteSubscription(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSubscriptionsQueryKey(queryParams) });
      },
    },
  });

  // Cancel mutation
  const cancelMutation = usePostApiV1AdminSubscriptionsSubscriptionIdCancel({
    mutation: {
      onSuccess: () => {
        setActionLoadingId(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSubscriptionsQueryKey(queryParams) });
      },
      onError: () => {
        setActionLoadingId(null);
      },
    },
  });

  // Reactivate mutation
  const reactivateMutation = usePostApiV1AdminSubscriptionsSubscriptionIdReactivate({
    mutation: {
      onSuccess: () => {
        setActionLoadingId(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSubscriptionsQueryKey(queryParams) });
      },
      onError: () => {
        setActionLoadingId(null);
      },
    },
  });

  const handleSearch = () => {
    setPage(1);
  };

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

  const getStatusBadge = (subStatus: string) => {
    switch (subStatus) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "TRIAL":
        return <Badge className="bg-blue-100 text-blue-700">Trial</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>;
      default:
        return <Badge variant="outline">{subStatus}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "PREMIUM_MONTHLY":
        return <Badge variant="outline">Monthly</Badge>;
      case "PREMIUM_ANNUAL":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Annual</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  // Derive error message from query error
  const errorMessage = error ? "Failed to fetch subscriptions" : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Subscriptions"
            value={stats.total.toLocaleString()}
            icon={CreditCard}
            color="blue"
          />
          <StatCard
            label="Active"
            value={stats.byStatus.find(s => s.status === 'ACTIVE')?.count || 0}
            icon={CreditCard}
            color="green"
          />
          <StatCard
            label="Trials"
            value={stats.byStatus.find(s => s.status === 'TRIAL')?.count || 0}
            icon={Clock}
            color="purple"
          />
          <StatCard
            label="Expiring Trials (7 days)"
            value={stats.expiringTrialsNext7Days}
            icon={AlertTriangle}
            color={stats.expiringTrialsNext7Days > 0 ? "orange" : "green"}
          />
        </div>
      )}

      {/* Status & Plan Breakdowns */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {stats.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center gap-2">
                    <Badge variant="outline">{item.status}</Badge>
                    <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Plan Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {stats.byPlanType.map((item) => (
                  <div key={item.planType} className="flex items-center gap-2">
                    <Badge variant="outline">{item.planType}</Badge>
                    <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by user email or site name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="TRIAL">Trial</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planType} onValueChange={(v) => { setPlanType(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="PREMIUM_MONTHLY">Monthly</SelectItem>
              <SelectItem value="PREMIUM_ANNUAL">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>User</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <Link
                          href={`/admin/users/${subscription.userId}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">{subscription.user?.email}</p>
                          {subscription.user?.fullName && (
                            <p className="text-sm text-gray-500">{subscription.user.fullName}</p>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/sites/${subscription.siteId}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">{subscription.site?.siteName}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">
                            {subscription.site?.siteUrl}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell>{getPlanBadge(subscription.planType)}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </div>
                        {subscription.trialEndsAt && subscription.status === "TRIAL" && (
                          <p className="text-xs text-blue-600">
                            Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={subscription.createdAt} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoadingId === subscription.id}>
                              {actionLoadingId === subscription.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/subscriptions/${subscription.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {subscription.status === "CANCELLED" ? (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(subscription)}
                                className="text-green-600"
                              >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : subscription.status !== "EXPIRED" ? (
                              <DropdownMenuItem
                                onClick={() => handleCancel(subscription)}
                                className="text-orange-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteSubscription(subscription)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} subscriptions
              </p>
              <Pagination
                currentPage={page}
                totalPages={data.pagination.pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : null}

      {/* Delete Confirmation Dialog */}
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
