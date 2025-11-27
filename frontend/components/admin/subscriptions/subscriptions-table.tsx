"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  XCircle,
  RefreshCcw,
  Calendar,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TimeAgo } from "@/components/ui/time-ago";
import { TablePagination } from "@/components/ui/table-pagination";
import { getSubscriptionStatusBadgeConfig } from "@/lib/utils/badge-helpers";
import type { AdminSubscription } from "@/lib/api/generated/models";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SubscriptionsTableProps {
  subscriptions: AdminSubscription[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  actionLoadingId: string | null;
  onCancel: (subscription: AdminSubscription) => void;
  onReactivate: (subscription: AdminSubscription) => void;
  onDelete: (subscription: AdminSubscription) => void;
}

export function SubscriptionsTable({
  subscriptions,
  pagination,
  onPageChange,
  actionLoadingId,
  onCancel,
  onReactivate,
  onDelete,
}: SubscriptionsTableProps) {
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "PREMIUM_MONTHLY":
        return <Badge variant="outline">Monthly</Badge>;
      case "PREMIUM_ANNUAL":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Annual
          </Badge>
        );
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800">
            <TableHead>User</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Period End</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No subscriptions found
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((subscription) => {
              const statusConfig = getSubscriptionStatusBadgeConfig(subscription.status);
              return (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <Link
                      href={`/admin/users/${subscription.userId}`}
                      className="hover:underline"
                    >
                      <p className="font-medium">{subscription.user?.email}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/sites/${subscription.siteId}`}
                      className="hover:underline"
                    >
                      <p className="font-medium">{subscription.site?.siteName}</p>
                    </Link>
                  </TableCell>
                  <TableCell>{getPlanBadge(subscription.planType)}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant} className={statusConfig.className}>
                      {statusConfig.label || subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                    {subscription.trialEndsAt && subscription.status === "TRIAL" && (
                      <p className="text-xs text-blue-600">
                        Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <TimeAgo date={subscription.createdAt} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoadingId === subscription.id}
                        >
                          {actionLoadingId === subscription.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/subscriptions/${subscription.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {subscription.status === "CANCELLED" ? (
                          <DropdownMenuItem
                            onClick={() => onReactivate(subscription)}
                            className="text-green-600"
                          >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        ) : subscription.status !== "EXPIRED" ? (
                          <DropdownMenuItem
                            onClick={() => onCancel(subscription)}
                            className="text-orange-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(subscription)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
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
            itemName="subscriptions"
          />
        </div>
      )}
    </div>
  );
}
