"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Receipt, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";

import { TransactionsTable } from "@/components/admin/billing/transactions-table";
import { RefundDialog } from "@/components/admin/billing/refund-dialog";

import {
  useGetApiV1AdminBillingTransactions,
  useDeleteApiV1AdminBillingTransactionsTransactionId,
  usePostApiV1AdminBillingTransactionsTransactionIdRefund,
  getGetApiV1AdminBillingTransactionsQueryKey,
} from "@/lib/api/generated/queries/admin-billing/admin-billing";

import type {
  AdminTransaction,
  GetApiV1AdminBillingTransactionsParams,
} from "@/lib/api/generated/models";

export default function AdminBillingPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteTransaction, setDeleteTransaction] = useState<AdminTransaction | null>(null);
  const [refundTransaction, setRefundTransaction] = useState<AdminTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("requested_by_customer");

  const queryParams: GetApiV1AdminBillingTransactionsParams = {
    page: page.toString(),
    limit: "20",
    ...(status !== "all" && { status }),
    ...(searchParams.get("userId") && { userId: searchParams.get("userId")! }),
    ...(searchParams.get("siteId") && { siteId: searchParams.get("siteId")! }),
  };

  const {
    data: transactionsResponse,
    isLoading,
    error,
  } = useGetApiV1AdminBillingTransactions(queryParams);

  const deleteTransactionMutation = useDeleteApiV1AdminBillingTransactionsTransactionId({
    mutation: {
      onSuccess: () => {
        setDeleteTransaction(null);
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminBillingTransactionsQueryKey(queryParams),
        });
      },
    },
  });

  const refundTransactionMutation = usePostApiV1AdminBillingTransactionsTransactionIdRefund({
    mutation: {
      onSuccess: (data) => {
        setRefundTransaction(null);
        setRefundAmount("");
        setRefundReason("requested_by_customer");
        toast.success(`Refund of ${formatCurrency(data.data.amount, "usd")} issued successfully`);
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminBillingTransactionsQueryKey(queryParams),
        });
      },
      onError: () => {
        toast.error("Failed to issue refund. Please try again.");
      },
    },
  });

  const handleDelete = async () => {
    if (!deleteTransaction) return;
    deleteTransactionMutation.mutate({ transactionId: deleteTransaction.id });
  };

  const handleRefund = async () => {
    if (!refundTransaction) return;
    const amount = refundAmount ? parseInt(refundAmount, 10) : undefined;
    refundTransactionMutation.mutate({
      transactionId: refundTransaction.id,
      data: {
        amount,
        reason: refundReason as "duplicate" | "fraudulent" | "requested_by_customer",
      },
    });
  };

  const openRefundDialog = (transaction: AdminTransaction) => {
    setRefundTransaction(transaction);
    setRefundAmount("");
    setRefundReason("requested_by_customer");
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const data = transactionsResponse?.data;
  const errorMessage = error ? "Failed to fetch transactions" : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Billing Transactions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage billing transactions
          </p>
        </div>
        {data && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {data.pagination.total.toLocaleString()} total
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="partially_refunded">Partial Refund</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {deleteTransactionMutation.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to delete transaction</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <TransactionsTable
            transactions={data.transactions}
            onRefund={openRefundDialog}
            onDelete={setDeleteTransaction}
          />

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="px-6 pb-4">
              <TablePagination
                page={page}
                limit={data.pagination.limit}
                total={data.pagination.total}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
                itemName="transactions"
              />
            </div>
          )}
        </>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTransaction}
        onOpenChange={(open) => !open && setDeleteTransaction(null)}
        onConfirm={handleDelete}
        isDeleting={deleteTransactionMutation.isPending}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction (${deleteTransaction?.id})? This action cannot be undone.`}
      />

      {/* Refund Dialog */}
      <RefundDialog
        transaction={refundTransaction}
        open={!!refundTransaction}
        onOpenChange={(open) => !open && setRefundTransaction(null)}
        refundAmount={refundAmount}
        onRefundAmountChange={setRefundAmount}
        refundReason={refundReason}
        onRefundReasonChange={setRefundReason}
        onRefund={handleRefund}
        isRefunding={refundTransactionMutation.isPending}
      />
    </div>
  );
}
