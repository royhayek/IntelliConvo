"use client";

import Link from "next/link";
import { MoreHorizontal, Trash2, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeAgo } from "@/components/ui/time-ago";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatCurrency } from "@/lib/utils";
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
  onDelete: (transaction: AdminTransaction) => void;
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

export function TransactionsTable({ transactions, pagination, onPageChange, onDelete }: TransactionsTableProps) {
  if (transactions.length === 0) {
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
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No transactions found
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

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
          {transactions.map((txn) => (
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
                      onClick={() => onDelete(txn)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
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
