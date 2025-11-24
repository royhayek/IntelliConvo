"use client";

import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSubscriptionStatusBadgeConfig } from "@/lib/utils/badge-helpers";

interface SubscriptionCardProps {
  subscription: {
    planType: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan</label>
              <p className="mt-1">
                <Badge variant="secondary">{subscription.planType}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1">
                {(() => {
                  const config = getSubscriptionStatusBadgeConfig(subscription.status);
                  return (
                    <Badge variant={config.variant} className={config.className}>
                      {config.label || subscription.status}
                    </Badge>
                  );
                })()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Period Started</label>
              <p className="mt-1">
                {subscription.currentPeriodStart
                  ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Period End</label>
              <p className="mt-1">
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No active subscription</p>
        )}
      </CardContent>
    </Card>
  );
}
