"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertOctagon,
  ExternalLink,
  Clock,
  DollarSign,
  User,
  ChevronRight,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatTimestamp } from "@/lib/utils";
import {
  getDisputeStatusBadgeConfig,
  getDisputeReasonLabel,
} from "@/lib/utils/badge-helpers";
import { getPaginationText } from "@/lib/utils/pagination";

// Import generated hooks
import {
  useGetApiV1AdminBillingDisputes,
} from "@/lib/api/generated/queries/admin-billing/admin-billing";

// Import generated types
import type {
  GetApiV1AdminBillingDisputesParams,
} from "@/lib/api/generated/models";

export default function AdminDisputesPage() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  // Build query params
  const queryParams: GetApiV1AdminBillingDisputesParams = {
    page: page.toString(),
    limit: "20",
    ...(status !== "all" && { status }),
  };

  // Use generated query hook for fetching disputes
  const {
    data: disputesResponse,
    isLoading,
    error,
  } = useGetApiV1AdminBillingDisputes(queryParams);

  // Extract data from response - disputesResponse is already the unwrapped data from react-query
  const data = disputesResponse?.data;
  const errorMessage = error ? "Failed to fetch disputes" : null;

  // Import types for dispute
  type Dispute = NonNullable<typeof data>["disputes"][number];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/billing" className="hover:text-gray-700 dark:hover:text-gray-300">
              Billing
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Disputes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="h-6 w-6 text-red-500" />
            Payment Disputes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and respond to payment disputes from Stripe
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="needs_response">Needs Response</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="warning_needs_response">Warning - Needs Response</SelectItem>
            <SelectItem value="charge_refunded">Charge Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertOctagon className="h-4 w-4" />
        <AlertDescription>
          Disputes should be responded to in the{" "}
          <a
            href="https://dashboard.stripe.com/disputes"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Stripe Dashboard
            <ExternalLink className="h-3 w-3 inline ml-1" />
          </a>
          . This page provides an overview of disputes for monitoring purposes.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertOctagon className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
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
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence Due</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No disputes found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.disputes.map((dispute: Dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <p className="font-mono text-sm truncate max-w-[120px]">
                          {dispute.id}
                        </p>
                      </TableCell>
                      <TableCell>
                        {dispute.localTransaction?.user ? (
                          <Link
                            href={`/admin/users/${dispute.localTransaction.user.id}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[150px]">
                              {dispute.localTransaction.user.email}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {formatCurrency(dispute.amount, dispute.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getDisputeReasonLabel(dispute.reason)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const config = getDisputeStatusBadgeConfig(dispute.status);
                          return (
                            <Badge variant={config.variant} className={config.className}>
                              {config.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {dispute.evidenceDueBy ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatTimestamp(dispute.evidenceDueBy)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatTimestamp(dispute.created)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://dashboard.stripe.com/disputes/${dispute.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
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
                {getPaginationText(
                  { page, limit: 20, total: data.pagination.total },
                  "disputes"
                )}
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
    </div>
  );
}
