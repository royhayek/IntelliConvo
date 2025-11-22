"use client";

import Link from "next/link";
import { ArrowLeft, Crown, Zap, Check, Calendar, CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRequireUser } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  useGetApiV1BillingSubscriptions,
  useGetApiV1BillingPlans,
  usePostApiV1BillingSubscriptions,
  usePostApiV1BillingSubscriptionsSubscriptionIdPortal,
} from "@/lib/api/generated/queries/subscriptions/subscriptions";
import type { Subscription } from "@/lib/api/generated/models";

export default function SubscriptionsPage() {
  // Protected route - redirects to login if not authenticated, admins to admin portal
  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireUser();

  const { data: subscriptions = [], isLoading } = useGetApiV1BillingSubscriptions({
    query: { enabled: isAuthenticated },
  });

  const { data: plans = [] } = useGetApiV1BillingPlans({
    query: { enabled: isAuthenticated },
  });

  const createSubscriptionMutation = usePostApiV1BillingSubscriptions();
  const portalMutation = usePostApiV1BillingSubscriptionsSubscriptionIdPortal();

  const handleSubscribe = async (planType: string) => {
    // Note: This needs a siteId - redirect to site selection or show modal
    console.log("Subscribe to plan:", planType);
    // TODO: Implement site selection modal
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

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Loading subscriptions" />;
  }

  if (!user) {
    return null;
  }

  const activeSubscription = subscriptions.find((sub: Subscription) => sub.status === "ACTIVE");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={user?.isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {user?.isAdmin ? "Back to Admin Portal" : "Back to Dashboard"}
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Intelligentconvo</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your subscription plans and billing</p>
          </div>

          {/* Current Subscription */}
          {activeSubscription && (
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSubscription && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-green-900 dark:text-green-300">
                              {activeSubscription.planType === "PREMIUM_ANNUAL" ? "Premium Annual" : "Premium Monthly"}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                              {activeSubscription.planType === "PREMIUM_ANNUAL" ? "$279/year" : "$29/month"}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                              Next billing: {new Date(activeSubscription.currentPeriodEnd!).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManageSubscription(activeSubscription.id!)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Available Plans</h2>

            {plans.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No subscription plans available at the moment.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.id === "PREMIUM_ANNUAL" ? "border-indigo-500 shadow-lg" : ""
                    }`}
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
                        {plan.interval === "monthly" || plan.billingPeriod === "monthly" ? (
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
                        <span className="text-gray-600 dark:text-gray-400">/{plan.interval}</span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{plan.description}</p>
                      )}
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features?.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-4">
                          {activeSubscription && activeSubscription.planType === plan.id ? (
                            <Button disabled className="w-full">
                              Current Plan
                            </Button>
                          ) : (
                            <Button
                              className={`w-full ${
                                plan.id === "PREMIUM_ANNUAL"
                                  ? "bg-indigo-600 hover:bg-indigo-700"
                                  : "bg-gray-900 hover:bg-gray-800"
                              }`}
                              onClick={() => plan.id && handleSubscribe(plan.id)}
                            >
                              Subscribe
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Payment Method</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activeSubscription ? "Manage your payment methods" : "No active subscription"}
                    </p>
                  </div>
                  <Link href="/account/billing">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </Link>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>• Secure payment processing</p>
                  <p>• Cancel anytime - no long-term commitments</p>
                  <p>• Questions? <a href="mailto:support@intelligentconvo.com" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Contact our support team</a></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}