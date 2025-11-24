"use client";

import { DollarSign, FileText, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatusCounts {
  paid: number;
  pending: number;
  failed: number;
}

interface BillingSummaryStatsProps {
  totalPaid: number;
  totalTransactions: number | undefined;
  statusCounts: StatusCounts;
}

export function BillingSummaryStats({
  totalPaid,
  totalTransactions,
  statusCounts,
}: BillingSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTransactions ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Paid
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.paid}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {statusCounts.pending} pending, {statusCounts.failed} failed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
