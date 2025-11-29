"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TablePagination } from "@/components/ui/table-pagination";

import {
  useGetAdminConversations,
  useDeleteAdminConversationsConversationId,
  getGetAdminConversationsQueryKey,
} from "@/lib/api/generated/queries/admin-conversations/admin-conversations";
import {
  getGetAdminStatsConversationsQueryKey,
  useGetAdminStatsConversations,
} from "@/lib/api/generated/queries/admin/admin";
import type { AdminConversation } from "@/lib/api/generated/models";
import {
  ConversationsStatsGrid,
  ConversationsTable,
  ConversationsFilters,
} from "@/components/admin/conversations";
import { GetAdminConversationsParams } from "@/lib/api/generated/models/getAdminConversationsParams";

interface ConversationStats {
  total: number;
  activeLast24h: number;
  totalMessages: number;
  messagesLast24h: number;
  avgMessagesPerConversation: number;
  totalTokensUsed: number;
  estimatedCostCents: number;
}

export default function AdminConversationsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [siteId, setSiteId] = useState<string | null>(
    searchParams.get("siteId") || null
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteConversation, setDeleteConversation] =
    useState<AdminConversation | null>(null);

  const queryParams: GetAdminConversationsParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(siteId && { siteId }),
  };

  const {
    data: conversationsResponse,
    isLoading: loading,
    error: conversationsError,
  } = useGetAdminConversations(queryParams);

  const { data: statsResponse } = useGetAdminStatsConversations();

  const deleteConversationMutation = useDeleteAdminConversationsConversationId({
    mutation: {
      onSuccess: () => {
        setDeleteConversation(null);
        queryClient.invalidateQueries({
          queryKey: [getGetAdminConversationsQueryKey()[0]],
        });
        queryClient.invalidateQueries({
          queryKey: getGetAdminStatsConversationsQueryKey(),
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

  const handleSiteChange = (id: string | null) => {
    setSiteId(id);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConversation) return;
    deleteConversationMutation.mutate({
      conversationId: deleteConversation.id,
    });
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

      {stats && <ConversationsStatsGrid stats={stats} />}

      <ConversationsFilters
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        siteId={siteId}
        onSiteChange={handleSiteChange}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <ConversationsTable
            conversations={data.conversations}
            pagination={data.pagination}
            onPageChange={setPage}
            onDelete={setDeleteConversation}
          />
        </>
      ) : null}

      <DeleteConfirmationDialog
        open={!!deleteConversation}
        onOpenChange={(open) => !open && setDeleteConversation(null)}
        onConfirm={handleDelete}
        isDeleting={deleteConversationMutation.isPending}
        title="Delete Conversation"
        description={`Are you sure you want to delete this conversation with ${
          deleteConversation?.messageCount || 0
        } messages? This action cannot be undone.`}
      />
    </div>
  );
}
