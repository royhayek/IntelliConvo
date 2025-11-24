"use client";

import { useState } from "react";
import { Crown, Zap, Check, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Plan, Subscription } from "@/lib/api/generated/models";
import {
  useGetProrationPreview,
  usePostChangePlan,
  type ProrationPreview,
} from "@/lib/api/plan-change";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PlanCardsProps {
  plans: Plan[];
  currentSubscription?: Subscription;
  onSubscribe: (planId: string) => void;
  isSubscribing: boolean;
}

export function PlanCards({
  plans,
  currentSubscription,
  onSubscribe,
  isSubscribing,
}: PlanCardsProps) {
  const queryClient = useQueryClient();
  const [changePlanDialog, setChangePlanDialog] = useState<{
    open: boolean;
    targetPlanId: string | null;
    targetPlanName: string;
  }>({
    open: false,
    targetPlanId: null,
    targetPlanName: "",
  });

  // Determine if current subscription can be changed
  const canChangePlan =
    currentSubscription &&
    ["ACTIVE", "TRIAL"].includes(currentSubscription.status) &&
    !currentSubscription.cancelAtPeriodEnd;

  // Fetch proration preview when dialog is open
  const { data: prorationPreview, isLoading: isLoadingPreview } =
    useGetProrationPreview(
      currentSubscription?.id || "",
      changePlanDialog.targetPlanId || "",
      {
        query: {
          enabled:
            changePlanDialog.open &&
            !!currentSubscription?.id &&
            !!changePlanDialog.targetPlanId,
        },
      }
    );

  // Change plan mutation
  const changePlanMutation = usePostChangePlan({
    mutation: {
      onSuccess: () => {
        toast.success("Plan changed successfully!");
        setChangePlanDialog({ open: false, targetPlanId: null, targetPlanName: "" });
        // Invalidate subscriptions query to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/v1/billing/subscriptions"] });
      },
      onError: () => {
        // Error toast is handled by axios interceptor
      },
    },
  });

  const handlePlanChange = (planId: string, planName: string) => {
    setChangePlanDialog({
      open: true,
      targetPlanId: planId,
      targetPlanName: planName,
    });
  };

  const confirmPlanChange = () => {
    if (!currentSubscription?.id || !changePlanDialog.targetPlanId) return;

    changePlanMutation.mutate({
      subscriptionId: currentSubscription.id,
      data: {
        newPlanType: changePlanDialog.targetPlanId as
          | "PREMIUM_MONTHLY"
          | "PREMIUM_ANNUAL",
      },
    });
  };

  const isUpgrade = (targetPlanId: string) => {
    // Annual is considered an upgrade from monthly
    return (
      currentSubscription?.planType === "PREMIUM_MONTHLY" &&
      targetPlanId === "PREMIUM_ANNUAL"
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No subscription plans available at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan =
            currentSubscription && currentSubscription.planType === plan.id;
          const showSwitchButton = canChangePlan && !isCurrentPlan;
          const showSubscribeButton = !currentSubscription && !isCurrentPlan;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.id === "PREMIUM_ANNUAL" ? "border-indigo-500 shadow-lg" : ""
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.id === "PREMIUM_ANNUAL" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center space-x-2">
                  {plan.interval === "monthly" ||
                  plan.billingPeriod === "monthly" ? (
                    <Zap className="h-6 w-6 text-indigo-600" />
                  ) : (
                    <Crown className="h-6 w-6 text-indigo-600" />
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{plan.interval}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {plan.description}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full bg-green-600">
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : showSwitchButton ? (
                      <Button
                        variant={
                          plan.id === "PREMIUM_ANNUAL" ? "default" : "outline"
                        }
                        className={`w-full ${
                          plan.id === "PREMIUM_ANNUAL"
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() =>
                          handlePlanChange(plan.id!, plan.name || "")
                        }
                        disabled={changePlanMutation.isPending}
                      >
                        {isUpgrade(plan.id!) ? (
                          <>
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Upgrade
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-4 w-4 mr-2" />
                            Switch Plan
                          </>
                        )}
                      </Button>
                    ) : showSubscribeButton ? (
                      <Button
                        variant={
                          plan.id === "PREMIUM_ANNUAL" ? "default" : "outline"
                        }
                        className={`w-full ${
                          plan.id === "PREMIUM_ANNUAL"
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => plan.id && onSubscribe(plan.id)}
                        disabled={isSubscribing}
                      >
                        {isSubscribing ? "Processing..." : "Subscribe"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Change Confirmation Dialog */}
      <Dialog
        open={changePlanDialog.open}
        onOpenChange={(open) =>
          !changePlanMutation.isPending &&
          setChangePlanDialog({ ...changePlanDialog, open })
        }
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {changePlanDialog.targetPlanId &&
              isUpgrade(changePlanDialog.targetPlanId)
                ? "Upgrade Plan"
                : "Switch Plan"}
            </DialogTitle>
            <DialogDescription>
              {`You're switching to ${changePlanDialog.targetPlanName}. Your current plan will continue until the end of your billing period, then the new plan will take effect.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">
                  Loading plan details...
                </span>
              </div>
            ) : prorationPreview ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Current Plan
                    </span>
                    <span className="font-medium">
                      {prorationPreview.currentPlan.name} (
                      {formatCurrency(
                        prorationPreview.currentPlan.price,
                        prorationPreview.currency
                      )}
                      )
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      New Plan
                    </span>
                    <span className="font-medium">
                      {prorationPreview.newPlan.name} (
                      {formatCurrency(
                        prorationPreview.newPlan.price,
                        prorationPreview.currency
                      )}
                      )
                    </span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Change takes effect
                    </span>
                    <span className="font-medium text-indigo-600">
                      {new Date(
                        prorationPreview.effectiveDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Amount due today</span>
                    <span className="text-green-600">No charge</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your current plan will continue until the date above. You&apos;ll be charged{" "}
                  {formatCurrency(prorationPreview.newPlan.price, prorationPreview.currency)}{" "}
                  when the new plan starts.
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setChangePlanDialog({
                  open: false,
                  targetPlanId: null,
                  targetPlanName: "",
                })
              }
              disabled={changePlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPlanChange}
              disabled={changePlanMutation.isPending || isLoadingPreview}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {changePlanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Change"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
