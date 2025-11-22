"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  DollarSign,
  ExternalLink,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
} from "@/lib/api/generated/queries/admin-billing/admin-billing";

// Import generated types
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

  // Build query params
  const queryParams: GetApiV1AdminBillingTransactionsParams = {
    page: page.toString(),
    limit: "20",
    ...(status !== "all" && { status }),
    ...(searchParams.get("userId") && { userId: searchParams.get("userId")! }),
    ...(searchParams.get("siteId") && { siteId: searchParams.get("siteId")! }),
  };

  // Use generated query hook for fetching transactions
  const {
    data: transactionsResponse,
    isLoading,
    error,
  } = useGetApiV1AdminBillingTransactions(queryParams);

  // Use generated mutation hook for deleting transactions
  const deleteTransactionMutation = useDeleteApiV1AdminBillingTransactionsTransactionId({
    mutation: {
      onSuccess: () => {
        setDeleteTransaction(null);
        // Invalidate and refetch transactions
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminBillingTransactionsQueryKey(queryParams),
        });
      },
    },
  });

  const handleDelete = async () => {
    if (!deleteTransaction) return;
    deleteTransactionMutation.mutate({ transactionId: deleteTransaction.id });
  };

  const getStatusBadge = (txStatus: string) => {
    switch (txStatus) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-700">Refunded</Badge>;
      default:
        return <Badge variant="outline">{txStatus}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Extract data from response
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
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
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

      {/* Delete mutation error */}
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
                  data.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <p className="font-mono text-sm truncate max-w-[150px]">
                          {transaction.id}
                        </p>
                      </TableCell>
                      <TableCell>
                        {transaction.user ? (
                          <Link
                            href={`/admin/users/${transaction.user.id}`}
                            className="hover:underline"
                          >
                            <p className="font-medium">{transaction.user.email}</p>
                            {transaction.user.fullName && (
                              <p className="text-sm text-gray-500">{transaction.user.fullName}</p>
                            )}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.siteId ? (
                          <Link
                            href={`/admin/sites/${transaction.siteId}`}
                            className="hover:underline"
                          >
                            <p className="font-medium">{transaction.siteId}</p>
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <TimeAgo date={transaction.createdAt} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/billing/${transaction.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTransaction(transaction)}
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
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} transactions
              </p>
              <Pagination
                currentPage={page}
                totalPages={data.pagination.pages}
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
        isDeleting={deleteTransactionMutation.isPending}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction (${deleteTransaction?.id})? This action cannot be undone.`}
      />
    </div>
  );
}
