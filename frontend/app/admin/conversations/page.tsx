"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  Clock,
  Coins,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";

import {
  useGetApiV1AdminConversations,
  useDeleteApiV1AdminConversationsConversationId,
  getGetApiV1AdminConversationsQueryKey,
} from "@/lib/api/generated/queries/admin-conversations/admin-conversations";
import { useGetApiV1AdminStatsConversations } from "@/lib/api/generated/queries/admin/admin";
import type {
  AdminConversation,
  GetApiV1AdminConversationsParams,
} from "@/lib/api/generated/models";

interface ConversationStats {
  total: number;
  activeLast24h: number;
  totalMessages: number;
  messagesLast24h: number;
  avgMessagesPerConversation: number;
  totalTokensUsed: number;
  estimatedCostCents: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function AdminConversationsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteConversation, setDeleteConversation] = useState<AdminConversation | null>(null);

  // Build query params
  const siteId = searchParams.get("siteId");
  const queryParams: GetApiV1AdminConversationsParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(siteId && { siteId }),
  };

  // Fetch conversations using generated hook
  const {
    data: conversationsResponse,
    isLoading: loading,
    error: conversationsError,
  } = useGetApiV1AdminConversations(queryParams);

  // Fetch conversation stats using generated hook
  const { data: statsResponse } = useGetApiV1AdminStatsConversations();

  // Delete mutation
  const deleteConversationMutation = useDeleteApiV1AdminConversationsConversationId({
    mutation: {
      onSuccess: () => {
        setDeleteConversation(null);
        // Invalidate and refetch conversations list
        queryClient.invalidateQueries({
          queryKey: [getGetApiV1AdminConversationsQueryKey()[0]],
        });
        // Also invalidate stats
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/admin/stats/conversations"],
        });
      },
    },
  });

  const data = conversationsResponse?.data;
  const stats = statsResponse?.data as ConversationStats | undefined;
  const error = conversationsError
    ? conversationsError instanceof Error
      ? conversationsError.message
      : "An error occurred"
    : deleteConversationMutation.error
    ? "Failed to delete conversation"
    : null;

  const handleSearch = () => {
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConversation) return;
    deleteConversationMutation.mutate({ conversationId: deleteConversation.id });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Conversations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage chat conversations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Conversations"
            value={stats.total.toLocaleString()}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            label="Active (24h)"
            value={stats.activeLast24h}
            icon={Clock}
            color="green"
          />
          <StatCard
            label="Total Messages"
            value={stats.totalMessages.toLocaleString()}
            icon={MessageSquare}
            color="purple"
          />
          <StatCard
            label="Tokens Used"
            value={stats.totalTokensUsed.toLocaleString()}
            icon={Coins}
            color="indigo"
          />
        </div>
      )}

      {/* Additional Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Messages (24h)"
            value={stats.messagesLast24h}
            icon={Clock}
            color="green"
          />
          <StatCard
            label="Avg Messages/Conversation"
            value={stats.avgMessagesPerConversation.toFixed(1)}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            label="Estimated Cost"
            value={formatCurrency(stats.estimatedCostCents)}
            icon={DollarSign}
            color="orange"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by session ID or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>Session</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No conversations found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>
                        <Link
                          href={`/admin/conversations/${conv.id}`}
                          className="hover:underline"
                        >
                          <div>
                            <p className="font-mono text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                              {conv.sessionId}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {conv.site && (
                          <Link
                            href={`/admin/sites/${conv.site.id}`}
                            className="hover:underline"
                          >
                            <p className="font-medium">{conv.site.siteName}</p>
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {conv.messageCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={conv.startedAt} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <TimeAgo date={conv.lastMessageAt} />
                        </div>
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
                              <Link href={`/admin/conversations/${conv.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Messages
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteConversation(conv)}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} conversations
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
        open={!!deleteConversation}
        onOpenChange={(open) => !open && setDeleteConversation(null)}
        onConfirm={handleDelete}
        isDeleting={deleteConversationMutation.isPending}
        title="Delete Conversation"
        description={`Are you sure you want to delete this conversation with ${deleteConversation?.messageCount || 0} messages? This action cannot be undone.`}
      />
    </div>
  );
}
