"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type {
  BillingSummaryActiveSubscriptionsItem,
  BillingSummaryUpcomingChargesItem,
} from "@/lib/api/generated/models";

interface ActiveSubscriptionsCardProps {
  siteId: string;
  subscriptions: BillingSummaryActiveSubscriptionsItem[] | undefined;
  upcomingCharges: BillingSummaryUpcomingChargesItem[] | undefined;
}

export function ActiveSubscriptionsCard({
  siteId,
  subscriptions,
  upcomingCharges,
}: ActiveSubscriptionsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active Subscriptions</CardTitle>
        <Link href={`/account/subscriptions?siteId=${siteId}`}>
          <Button variant="outline" size="sm">
            Manage Subscriptions
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!subscriptions?.length ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active subscriptions</p>
            <p className="text-sm text-gray-500">
              Start a subscription to begin using advanced features
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {subscription.site?.siteName ?? "Unknown Site"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subscription.planType?.replace("_", " ") ?? "Unknown Plan"}
                      <span className="mx-1">•</span>
                      Next billing:{" "}
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={subscription.status === "ACTIVE" ? "default" : "secondary"}
                  className={
                    subscription.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  }
                >
                  {subscription.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Charges */}
        {(upcomingCharges?.length ?? 0) > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Upcoming Charges
            </h4>
            <div className="space-y-2">
              {upcomingCharges?.map((charge, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {charge.siteName}
                  </span>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(charge.amount ?? 0)}</p>
                    <p className="text-xs text-gray-500">
                      {charge.dueDate
                        ? new Date(charge.dueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
