"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useGetAdminSubscriptionsSubscriptionId,
  usePatchAdminSubscriptionsSubscriptionId,
  getGetAdminSubscriptionsSubscriptionIdQueryKey,
} from "@/lib/api/generated/queries/admin-subscriptions/admin-subscriptions";
import type {
  PatchAdminSubscriptionsSubscriptionIdBody,
  PatchAdminSubscriptionsSubscriptionIdBodyStatus,
  PatchAdminSubscriptionsSubscriptionIdBodyPlanType,
} from "@/lib/api/generated/models";
import {
  PatchAdminSubscriptionsSubscriptionIdBodyStatus as StatusEnum,
  PatchAdminSubscriptionsSubscriptionIdBodyPlanType as PlanTypeEnum,
} from "@/lib/api/generated/models";

const STATUS_OPTIONS: { value: PatchAdminSubscriptionsSubscriptionIdBodyStatus; label: string }[] = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

const PLAN_TYPE_OPTIONS: { value: PatchAdminSubscriptionsSubscriptionIdBodyPlanType; label: string }[] = [
  { value: "PREMIUM_MONTHLY", label: "Premium Monthly" },
  { value: "PREMIUM_ANNUAL", label: "Premium Annual" },
];

export default function AdminSubscriptionEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscriptionId = params.subscriptionId as string;

  const [formData, setFormData] = useState<PatchAdminSubscriptionsSubscriptionIdBody>({
    status: "ACTIVE",
    planType: "PREMIUM_MONTHLY",
    currentPeriodEnd: "",
    trialEndsAt: null,
  });
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch subscription details
  const {
    data: subscriptionResponse,
    isLoading,
    error: fetchError,
  } = useGetAdminSubscriptionsSubscriptionId(subscriptionId);

  const subscription = subscriptionResponse?.data;

  // Update mutation
  const updateMutation = usePatchAdminSubscriptionsSubscriptionId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminSubscriptionsSubscriptionIdQueryKey(subscriptionId),
        });
        router.push(`/admin/subscriptions/${subscriptionId}`);
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to update subscription"
        );
      },
    },
  });

  // Initialize form data when subscription is loaded
  useEffect(() => {
    if (subscription) {
      setFormData({
        status: subscription.status as PatchAdminSubscriptionsSubscriptionIdBodyStatus,
        planType: subscription.planType as PatchAdminSubscriptionsSubscriptionIdBodyPlanType,
        currentPeriodEnd: subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd).toISOString().split("T")[0]
          : "",
        trialEndsAt: subscription.trialEndsAt
          ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
          : null,
      });
    }
  }, [subscription]);

  // Track changes
  useEffect(() => {
    if (subscription) {
      const changed =
        formData.status !== subscription.status ||
        formData.planType !== subscription.planType ||
        formData.currentPeriodEnd !==
          new Date(subscription.currentPeriodEnd).toISOString().split("T")[0] ||
        (formData.trialEndsAt || null) !==
          (subscription.trialEndsAt
            ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
            : null);
      setHasChanges(changed);
    }
  }, [formData, subscription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);

    // Only send changed fields
    const updates: PatchAdminSubscriptionsSubscriptionIdBody = {};

    if (formData.status !== subscription?.status) {
      updates.status = formData.status;
    }
    if (formData.planType !== subscription?.planType) {
      updates.planType = formData.planType;
    }
    if (
      formData.currentPeriodEnd !==
      new Date(subscription?.currentPeriodEnd || "").toISOString().split("T")[0]
    ) {
      // Convert date to ISO string for API
      updates.currentPeriodEnd = new Date(formData.currentPeriodEnd || "").toISOString();
    }
    if (
      (formData.trialEndsAt || null) !==
      (subscription?.trialEndsAt
        ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
        : null)
    ) {
      // Convert date to ISO string for API, or set to null
      updates.trialEndsAt = formData.trialEndsAt
        ? new Date(formData.trialEndsAt).toISOString()
        : null;
    }

    updateMutation.mutate({
      subscriptionId,
      data: updates,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load subscription</AlertDescription>
      </Alert>
    );
  }

  if (!subscription) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Error alert */}
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
            <Link href={`/admin/subscriptions/${subscriptionId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscription
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Subscription</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/subscriptions/${subscriptionId}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subscription Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Settings
            </CardTitle>
            <CardDescription>
              Manage subscription plan and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Type */}
            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type</Label>
              <Select
                value={formData.planType}
                onValueChange={(value: PatchAdminSubscriptionsSubscriptionIdBodyPlanType) =>
                  setFormData({ ...formData, planType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: PatchAdminSubscriptionsSubscriptionIdBodyStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing this manually may affect billing and site functionality
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Date Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Management
            </CardTitle>
            <CardDescription>
              Manage subscription periods and trial dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Period Start (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="currentPeriodStart">Current Period Start</Label>
              <Input
                id="currentPeriodStart"
                type="date"
                value={
                  subscription.currentPeriodStart
                    ? new Date(subscription.currentPeriodStart).toISOString().split("T")[0]
                    : ""
                }
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This date is managed automatically and cannot be changed
              </p>
            </div>

            {/* Current Period End */}
            <div className="space-y-2">
              <Label htmlFor="currentPeriodEnd">Current Period End</Label>
              <Input
                id="currentPeriodEnd"
                type="date"
                value={formData.currentPeriodEnd || ""}
                onChange={(e) =>
                  setFormData({ ...formData, currentPeriodEnd: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                The date when the current billing period ends
              </p>
            </div>

            {/* Trial End Date */}
            <div className="space-y-2">
              <Label htmlFor="trialEndsAt" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Trial End Date
              </Label>
              <Input
                id="trialEndsAt"
                type="date"
                value={formData.trialEndsAt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trialEndsAt: e.target.value || null,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if not in trial period. Only relevant when status is TRIAL.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Read-only Information */}
        <Card>
          <CardHeader>
            <CardTitle>Read-only Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Subscription ID:</strong> {subscription.id}
              </p>
              {subscription.user && (
                <p className="text-sm text-muted-foreground">
                  <strong>User:</strong> {subscription.user.email}
                </p>
              )}
              {subscription.site && (
                <p className="text-sm text-muted-foreground">
                  <strong>Site:</strong> {subscription.site.siteName}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                <strong>Created:</strong>{" "}
                {new Date(subscription.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
