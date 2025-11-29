"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CreditCard,
  User,
  Globe,
  Calendar,
  Clock,
  Trash2,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  Edit,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";
import {
  useGetAdminSubscriptionsSubscriptionId,
  useDeleteAdminSubscriptionsSubscriptionId,
  usePostAdminSubscriptionsSubscriptionIdCancel,
  usePostAdminSubscriptionsSubscriptionIdReactivate,
  usePostAdminSubscriptionsSubscriptionIdExtendTrial,
  getGetAdminSubscriptionsSubscriptionIdQueryKey,
} from "@/lib/api/generated/queries/admin-subscriptions/admin-subscriptions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscriptionId = params.subscriptionId as string;

  const [showDelete, setShowDelete] = useState(false);
  const [showExtendTrial, setShowExtendTrial] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch subscription details
  const {
    data: subscriptionData,
    isLoading,
    error: fetchError,
  } = useGetAdminSubscriptionsSubscriptionId(subscriptionId);

  const subscription = subscriptionData?.data;

  // Delete mutation
  const deleteMutation = useDeleteAdminSubscriptionsSubscriptionId({
    mutation: {
      onSuccess: () => {
        router.push("/admin/subscriptions");
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to delete subscription"
        );
      },
    },
  });

  // Cancel mutation
  const cancelMutation = usePostAdminSubscriptionsSubscriptionIdCancel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminSubscriptionsSubscriptionIdQueryKey(subscriptionId),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to cancel subscription"
        );
      },
    },
  });

  // Reactivate mutation
  const reactivateMutation = usePostAdminSubscriptionsSubscriptionIdReactivate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminSubscriptionsSubscriptionIdQueryKey(subscriptionId),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to reactivate subscription"
        );
      },
    },
  });

  // Extend trial mutation
  const extendTrialMutation = usePostAdminSubscriptionsSubscriptionIdExtendTrial({
    mutation: {
      onSuccess: () => {
        setShowExtendTrial(false);
        queryClient.invalidateQueries({
          queryKey: getGetAdminSubscriptionsSubscriptionIdQueryKey(subscriptionId),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to extend trial"
        );
      },
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ subscriptionId });
  };

  const handleCancel = () => {
    setMutationError(null);
    cancelMutation.mutate({ subscriptionId });
  };

  const handleReactivate = () => {
    setMutationError(null);
    reactivateMutation.mutate({ subscriptionId });
  };

  const handleExtendTrial = () => {
    setMutationError(null);
    extendTrialMutation.mutate({
      subscriptionId,
      data: { days: extendDays },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "TRIAL":
        return <Badge className="bg-blue-100 text-blue-700">Trial</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "PREMIUM_MONTHLY":
        return <Badge variant="secondary">Premium Monthly</Badge>;
      case "PREMIUM_ANNUAL":
        return <Badge className="bg-purple-100 text-purple-700">Premium Annual</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const error = fetchError ? "Failed to fetch subscription" : mutationError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!subscription) {
    return null;
  }

  const isActionPending =
    cancelMutation.isPending ||
    reactivateMutation.isPending ||
    extendTrialMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {mutationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/subscriptions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscriptions
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {subscription.status === "TRIAL" && (
            <Button
              variant="outline"
              onClick={() => setShowExtendTrial(true)}
              disabled={isActionPending}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Extend Trial
            </Button>
          )}
          {subscription.status === "CANCELLED" ? (
            <Button
              variant="outline"
              onClick={handleReactivate}
              disabled={isActionPending}
              className="text-green-600"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {reactivateMutation.isPending ? "Reactivating..." : "Reactivate"}
            </Button>
          ) : subscription.status !== "EXPIRED" ? (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isActionPending}
              className="text-orange-600"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link href={`/admin/subscriptions/${subscriptionId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Subscription Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan</label>
              <p className="mt-1">{getPlanBadge(subscription.planType)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1">{getStatusBadge(subscription.status)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Current Period Start
              </label>
              <p className="mt-1">
                {new Date(subscription.currentPeriodStart).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Current Period End
              </label>
              <p className="mt-1">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {subscription.trialEndsAt && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Trial Ends
                </label>
                <p className="mt-1">
                  {new Date(subscription.trialEndsAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Created
              </label>
              <p className="mt-1">
                <TimeAgo date={subscription.createdAt} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Card */}
      {subscription.user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{subscription.user.email}</p>
                <p className="text-sm text-gray-500">User ID: {subscription.userId}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/users/${subscription.userId}`}>View User</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Card */}
      {subscription.site && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{subscription.site.siteName}</p>
                <p className="text-sm text-gray-500">Site ID: {subscription.siteId}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/sites/${subscription.siteId}`}>View Site</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Subscription"
        description={`Are you sure you want to delete this subscription? This action cannot be undone.`}
      />

      {/* Extend Trial Dialog */}
      <Dialog open={showExtendTrial} onOpenChange={setShowExtendTrial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial Period</DialogTitle>
            <DialogDescription>
              Extend the trial period for this subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="days">Number of days to extend</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="365"
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendTrial(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExtendTrial}
              disabled={extendTrialMutation.isPending}
            >
              {extendTrialMutation.isPending ? "Extending..." : `Extend by ${extendDays} days`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
