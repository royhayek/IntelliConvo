"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Zap, Check, Calendar, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import {
  useGetApiBillingHistory,
  useGetApiBillingSummary,
  useGetApiBillingSubscriptions,
  useGetApiBillingPlans,
  usePostApiBillingSubscriptions,
  usePostApiBillingSubscriptionsSubscriptionIdPortal,
} from "@/lib/api/generated/queries/billing/billing";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const { data: subscriptions = [], isLoading } = useGetApiBillingSubscriptions({
    query: { enabled: isAuthenticated },
  });

  const { data: plans = [] } = useGetApiBillingPlans({
    query: { enabled: isAuthenticated },
  });

  const createSubscriptionMutation = usePostApiBillingSubscriptions();
  const portalMutation = usePostApiBillingSubscriptionsSubscriptionIdPortal();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

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

  if (!isAuthenticated || !user) {
    return null;
  }

  const activeSubscription = subscriptions.find((sub) => sub.status === "ACTIVE");
  const trialSubscription = subscriptions.find((sub) => sub.status === "TRIAL");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
                <span className="text-xl font-bold text-gray-900">Intelligentconvo</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-600">Manage your subscription plans and billing</p>
          </div>

          {/* Current Subscription */}
          {(activeSubscription || trialSubscription) && (
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trialSubscription && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900">Free Trial</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Expires on {new Date(trialSubscription.trialEndsAt!).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-blue-600 mt-2">
                              Experience all features with your 14-day free trial
                            </p>
                          </div>
                          <Crown className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    )}

                    {activeSubscription && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-green-900">
                              {activeSubscription.planType === "PREMIUM_ANNUAL" ? "Premium Annual" : "Premium Monthly"}
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              {activeSubscription.planType === "PREMIUM_ANNUAL" ? "$279/year" : "$29/month"}
                            </p>
                            <p className="text-sm text-green-600 mt-2">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>

            {plans.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-600">No subscription plans available at the moment.</p>
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
                        {plan.interval === "month" ? (
                          <Zap className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <Crown className="h-6 w-6 text-indigo-600" />
                        )}
                        <CardTitle>{plan.name}</CardTitle>
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-600">/{plan.interval}</span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                      )}
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features?.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600">{feature}</span>
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
                              {trialSubscription ? "Upgrade Now" : "Start Trial"}
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
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Method</h4>
                    <p className="text-sm text-gray-600">
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

                <div className="text-sm text-gray-600 space-y-2">
                  <p>• All plans include a 14-day free trial</p>
                  <p>• Cancel anytime - no long-term commitments</p>
                  <p>• Questions? <a href="mailto:support@intelligentconvo.com" className="text-indigo-600 hover:text-indigo-500">Contact our support team</a></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}