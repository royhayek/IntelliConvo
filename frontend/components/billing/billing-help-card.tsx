"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BillingHelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border dark:border-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Billing Questions
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Have questions about your bill or need assistance?
          </p>
          <a
            href="mailto:billing@intelligentconvo.com"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            Contact Billing Support
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
