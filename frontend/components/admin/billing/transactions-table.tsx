"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Trash2, DollarSign, RotateCcw } from "lucide-react";
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
import { TimeAgo } from "@/components/ui/time-ago";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatCurrency } from "@/lib/utils";
import { getTransactionStatusBadgeConfig } from "@/lib/utils/badge-helpers";
import type { AdminTransaction } from "@/lib/api/generated/models";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TransactionsTableProps {
  transactions: AdminTransaction[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onRefund: (transaction: AdminTransaction) => void;
  onDelete: (transaction: AdminTransaction) => void;
}

export function TransactionsTable({
  transactions,
  pagination,
  onPageChange,
  onRefund,
  onDelete,
}: TransactionsTableProps) {
  const renderStatusBadge = (status: string) => {
    const config = getTransactionStatusBadgeConfig(status);
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
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
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
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
                <TableCell>{renderStatusBadge(transaction.status)}</TableCell>
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
                      {transaction.status === "paid" && (
                        <DropdownMenuItem onClick={() => onRefund(transaction)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Issue Refund
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(transaction)}
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
      {pagination && onPageChange && (
        <div className="px-6 pb-4">
          <TablePagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            itemName="transactions"
          />
        </div>
      )}
    </div>
  );
}
