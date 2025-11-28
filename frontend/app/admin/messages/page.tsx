"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { MessagesSquare, AlertTriangle } from "lucide-react";
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
import { MessagesTable } from "@/components/admin/messages";
import {
  useGetApiV1AdminMessages,
  useDeleteApiV1AdminMessagesMessageId,
  getGetApiV1AdminMessagesQueryKey,
} from "@/lib/api/generated/queries/admin-messages/admin-messages";
import type {
  GetApiV1AdminMessagesParams,
  GetApiV1AdminMessagesRole,
} from "@/lib/api/generated/models";

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  tokensUsed: number | null;
  costInCents: number | null;
  conversation: {
    id: string;
    sessionId: string;
    userIdentifier: string | null;
    site: {
      id: string;
      siteName: string;
      user: {
        id: string;
        email: string;
      };
    };
  };
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteMessage, setDeleteMessage] = useState<Message | null>(null);

  const conversationId = searchParams.get("conversationId");
  const siteId = searchParams.get("siteId");

  const queryParams: GetApiV1AdminMessagesParams = {
    page: page.toString(),
    limit: "20",
    ...(role !== "all" && {
      role: role.toUpperCase() as GetApiV1AdminMessagesRole,
    }),
    ...(conversationId && { conversationId }),
    ...(siteId && { siteId }),
  };

  const {
    data: response,
    isLoading,
    error,
  } = useGetApiV1AdminMessages(queryParams);

  const deleteMutation = useDeleteApiV1AdminMessagesMessageId({
    mutation: {
      onSuccess: () => {
        setDeleteMessage(null);
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminMessagesQueryKey(queryParams),
        });
      },
    },
  });

  const handleDelete = () => {
    if (!deleteMessage) return;
    deleteMutation.mutate({ messageId: deleteMessage.id });
  };

  const data = response?.data as
    | {
        messages: Message[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
    | undefined;

  const errorMessage =
    error instanceof Error
      ? error.message
      : deleteMutation.error
      ? "Failed to delete message"
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessagesSquare className="h-6 w-6" />
            Messages
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View individual chat messages
          </p>
        </div>
        {data && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {data.pagination.total.toLocaleString()} total
          </Badge>
        )}
      </div>

      <div className="flex gap-4">
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="assistant">Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <MessagesTable messages={data.messages} onDelete={setDeleteMessage} />
      ) : null}

      <DeleteConfirmationDialog
        open={!!deleteMessage}
        onOpenChange={(open) => !open && setDeleteMessage(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
      />
    </div>
  );
}
