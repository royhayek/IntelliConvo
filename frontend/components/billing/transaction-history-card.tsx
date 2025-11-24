"use client";

import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getTransactionStatusBadgeConfig } from "@/lib/utils/badge-helpers";
import type { BillingTransaction } from "@/lib/api/generated/models";

interface Pagination {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
}

interface TransactionHistoryCardProps {
  transactions: BillingTransaction[];
  pagination: Pagination;
  isLoading: boolean;
  onViewReceipt: (transactionId: string) => void;
  loadingReceiptId?: string | null;
}

export function TransactionHistoryCard({
  transactions,
  pagination,
  isLoading,
  onViewReceipt,
  loadingReceiptId,
}: TransactionHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions yet</p>
            <p className="text-sm text-gray-500">
              Your billing history will appear here once you start a subscription
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const statusConfig = getTransactionStatusBadgeConfig(
                  transaction.status || "pending"
                );
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      #{transaction.invoiceId || "N/A"}
                    </TableCell>
                    <TableCell>{transaction.site?.siteName || "-"}</TableCell>
                    <TableCell>
                      {transaction.createdAt
                        ? new Date(transaction.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusConfig.variant}
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(
                        transaction.amount ?? 0,
                        transaction.currency || "USD"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.status === "paid" && transaction.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewReceipt(transaction.id!)}
                          disabled={loadingReceiptId === transaction.id}
                        >
                          {loadingReceiptId === transaction.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          {loadingReceiptId === transaction.id ? "Loading..." : "View"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {(pagination.pages ?? 0) > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Page {pagination.page ?? 1} of {pagination.pages ?? 1} ({pagination.total ?? 0} total)
            </p>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={(pagination.page ?? 1) === 1}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.page ?? 1) === (pagination.pages ?? 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
