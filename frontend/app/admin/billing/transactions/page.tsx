"use client";

import { useState } from "react";
import { Receipt, MoreHorizontal, AlertTriangle, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { UserFilter } from "@/components/admin/user-filter";
import {
  TransactionsStatsCards,
  TransactionsTable,
} from "@/components/admin/transactions";
import {
  useGetApiV1AdminBillingTransactions,
  useDeleteApiV1AdminBillingTransactionsTransactionId,
  getGetApiV1AdminBillingTransactionsQueryKey,
  getApiV1AdminBillingTransactionsExport,
} from "@/lib/api/generated/queries/admin-billing/admin-billing";
import { useGetApiV1AdminStatsBilling } from "@/lib/api/generated/queries/admin/admin";
import type {
  AdminTransaction,
  GetApiV1AdminBillingTransactionsParams,
  GetApiV1AdminBillingTransactionsExportFormat,
} from "@/lib/api/generated/models";

interface BillingStats {
  totalTransactions: number;
  totalRevenue: number;
  revenueThisMonth: number;
  transactionsByStatus: { status: string; count: number }[];
}

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deleteTransaction, setDeleteTransaction] =
    useState<AdminTransaction | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const queryParams: GetApiV1AdminBillingTransactionsParams = {
    page: page.toString(),
    limit: "20",
    ...(status !== "all" && { status }),
    ...(userId && { userId }),
  };

  const {
    data: transactionsResponse,
    isLoading,
    error: transactionsError,
  } = useGetApiV1AdminBillingTransactions(queryParams);

  const { data: statsResponse } = useGetApiV1AdminStatsBilling();

  const deleteMutation = useDeleteApiV1AdminBillingTransactionsTransactionId({
    mutation: {
      onSuccess: () => {
        setDeleteTransaction(null);
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminBillingTransactionsQueryKey(queryParams),
        });
      },
      onError: (error) => {
        setExportError(
          error instanceof Error
            ? error.message
            : "Failed to delete transaction"
        );
      },
    },
  });

  const data = transactionsResponse?.data;
  const stats = statsResponse?.data as BillingStats | undefined;
  const error = transactionsError
    ? "Failed to fetch transactions"
    : exportError;

  const handleExport = async (
    format: GetApiV1AdminBillingTransactionsExportFormat
  ) => {
    try {
      setExportError(null);
      const params = {
        format,
        ...(status !== "all" && { status }),
      };

      const response = await getApiV1AdminBillingTransactionsExport(params, {
        responseType: format === "csv" ? "blob" : "json",
      });

      if (format === "csv") {
        const blob = response as unknown as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = response as unknown as { data: unknown };
        const blob = new Blob([JSON.stringify(jsonData.data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      setExportError("Failed to export transactions");
    }
  };

  const handleDelete = () => {
    if (!deleteTransaction) return;
    deleteMutation.mutate({ transactionId: deleteTransaction.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Transactions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage billing transactions
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionsStatsCards stats={stats} />

      <div className="flex gap-4 flex-wrap">
        <UserFilter
          value={userId}
          onChange={(id) => {
            setUserId(id);
            setPage(1);
          }}
          placeholder="All Users"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <TransactionsTable
          transactions={data.transactions}
          pagination={data.pagination}
          onPageChange={setPage}
          onDelete={setDeleteTransaction}
        />
      ) : null}

      <DeleteConfirmationDialog
        open={!!deleteTransaction}
        onOpenChange={(open) => !open && setDeleteTransaction(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}
