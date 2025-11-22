"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessagesSquare,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  User,
  Bot,
  Coins,
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
import {
  useGetApiV1AdminMessages,
  useDeleteApiV1AdminMessagesMessageId,
  getGetApiV1AdminMessagesQueryKey,
} from "@/lib/api/generated/queries/admin-messages/admin-messages";
import type {
  GetApiV1AdminMessagesParams,
  GetApiV1AdminMessagesRole,
} from "@/lib/api/generated/models";

// Extended message type to include conversation data from the API response
// The generated AdminMessage type is incomplete, so we extend it here
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

  // Build query params
  const conversationId = searchParams.get("conversationId");
  const siteId = searchParams.get("siteId");

  const queryParams: GetApiV1AdminMessagesParams = {
    page: page.toString(),
    limit: "20",
    ...(role !== "all" && { role: role.toUpperCase() as GetApiV1AdminMessagesRole }),
    ...(conversationId && { conversationId }),
    ...(siteId && { siteId }),
  };

  // Fetch messages using generated hook
  const {
    data: response,
    isLoading,
    error,
  } = useGetApiV1AdminMessages(queryParams);

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminMessagesMessageId({
    mutation: {
      onSuccess: () => {
        setDeleteMessage(null);
        // Invalidate the messages query to refetch
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

  // Cast the response data to include the extended message type
  const data = response?.data as {
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | undefined;

  const getRoleBadge = (messageRole: string) => {
    if (messageRole === "user" || messageRole === "USER") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <User className="h-3 w-3 mr-1" />
          User
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700">
        <Bot className="h-3 w-3 mr-1" />
        Assistant
      </Badge>
    );
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const errorMessage = error instanceof Error ? error.message : deleteMutation.error ? "Failed to delete message" : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
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

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
                  <TableHead>Role</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>{getRoleBadge(message.role)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700 dark:text-gray-300 max-w-md">
                          {truncateContent(message.content)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/sites/${message.conversation.site.id}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">{message.conversation.site.siteName}</p>
                        </Link>
                        <Link
                          href={`/admin/conversations/${message.conversation.id}`}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          View conversation
                        </Link>
                      </TableCell>
                      <TableCell>
                        {message.tokensUsed ? (
                          <div className="text-sm">
                            <Badge variant="outline">
                              <Coins className="h-3 w-3 mr-1" />
                              {message.tokensUsed.toLocaleString()}
                            </Badge>
                            {message.costInCents && (
                              <p className="text-gray-500 mt-1">
                                ${(message.costInCents / 100).toFixed(4)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={message.timestamp} />
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
                              <Link href={`/admin/conversations/${message.conversation.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Conversation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteMessage(message)}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} messages
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
