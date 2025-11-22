"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";

// Import generated hooks
import {
  useGetApiV1AdminBillingTransactions,
  useDeleteApiV1AdminBillingTransactionsTransactionId,
  getGetApiV1AdminBillingTransactionsQueryKey,
  getApiV1AdminBillingTransactionsExport,
} from "@/lib/api/generated/queries/admin-billing/admin-billing";
import { useGetApiV1AdminStatsBilling } from "@/lib/api/generated/queries/admin/admin";

// Import generated types
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

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="outline">
          <DollarSign className="h-3 w-3 mr-1" />
          Refunded
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTransaction, setDeleteTransaction] = useState<AdminTransaction | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Build query params
  const queryParams: GetApiV1AdminBillingTransactionsParams = {
    page: page.toString(),
    limit: "20",
    ...(status !== "all" && { status }),
  };

  // Fetch transactions using generated hook
  const {
    data: transactionsResponse,
    isLoading,
    error: transactionsError,
  } = useGetApiV1AdminBillingTransactions(queryParams);

  // Fetch billing stats using generated hook
  const { data: statsResponse } = useGetApiV1AdminStatsBilling();

  // Delete mutation using generated hook
  const deleteMutation = useDeleteApiV1AdminBillingTransactionsTransactionId({
    mutation: {
      onSuccess: () => {
        setDeleteTransaction(null);
        // Invalidate and refetch transactions list
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminBillingTransactionsQueryKey(queryParams),
        });
      },
      onError: (error) => {
        setExportError(error instanceof Error ? error.message : "Failed to delete transaction");
      },
    },
  });

  // Extract data from responses
  const data = transactionsResponse?.data;
  const stats = statsResponse?.data as BillingStats | undefined;
  const error = transactionsError ? "Failed to fetch transactions" : exportError;

  const handleExport = async (format: GetApiV1AdminBillingTransactionsExportFormat) => {
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
        const blob = new Blob([JSON.stringify(jsonData.data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setExportError("Failed to export transactions");
    }
  };

  const handleDelete = () => {
    if (!deleteTransaction) return;
    deleteMutation.mutate({ transactionId: deleteTransaction.id });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Transactions"
            value={stats.totalTransactions.toLocaleString()}
            icon={Receipt}
            color="blue"
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            label="Revenue (This Month)"
            value={formatCurrency(stats.revenueThisMonth)}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            label="Paid Transactions"
            value={stats.transactionsByStatus.find(s => s.status === 'paid')?.count || 0}
            icon={CheckCircle}
            color="green"
          />
        </div>
      )}

      {/* Transaction Status Breakdown */}
      {stats && stats.transactionsByStatus.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transactions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.transactionsByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <code className="text-sm">{txn.id}</code>
                      </TableCell>
                      <TableCell>
                        {txn.user ? (
                          <Link href={`/admin/users/${txn.user.id}`} className="hover:underline">
                            <p className="font-medium">{txn.user.email}</p>
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.siteId ? (
                          <Link href={`/admin/sites/${txn.siteId}`} className="hover:underline">
                            {txn.siteId}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(txn.amount, txn.currency)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(txn.status)}</TableCell>
                      <TableCell>
                        <TimeAgo date={txn.createdAt} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteTransaction(txn)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} transactions
              </p>
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
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
        isDeleting={deleteMutation.isPending}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}
