"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingInfoCardProps {
  siteId: string;
  hasSubscription: boolean;
}

export function BillingInfoCard({ siteId, hasSubscription }: BillingInfoCardProps) {
  return (
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
                {hasSubscription ? "Manage your payment methods" : "No active subscription"}
              </p>
            </div>
            <Link href={`/account/billing?siteId=${siteId}`}>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View History
              </Button>
            </Link>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>Secure payment processing</p>
            <p>Cancel anytime - no long-term commitments</p>
            <p>
              Questions?{" "}
              <a
                href="mailto:support@intelligentconvo.com"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
