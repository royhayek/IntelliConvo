"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  Coins,
  DollarSign,
  User,
  Bot,
  Trash2,
  AlertTriangle,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useGetApiV1AdminConversationsConversationId,
  useDeleteApiV1AdminConversationsConversationId,
  getGetApiV1AdminConversationsQueryKey,
} from "@/lib/api/generated/queries/admin-conversations/admin-conversations";
import type { AdminConversationDetail } from "@/lib/api/generated/models";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function AdminConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const conversationId = params.conversationId as string;

  const [showDelete, setShowDelete] = useState(false);

  // Fetch conversation detail using generated hook
  const {
    data: response,
    isLoading,
    error,
  } = useGetApiV1AdminConversationsConversationId(conversationId);

  // Use the AdminConversationDetail type from the generated API
  const conversation: AdminConversationDetail | undefined = response?.data;

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminConversationsConversationId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [getGetApiV1AdminConversationsQueryKey()[0]],
        });
        router.push("/admin/conversations");
      },
    },
  });

  const handleDelete = async () => {
    deleteMutation.mutate({ conversationId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error ? "Failed to load conversation" : "Conversation not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Conversation Detail
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
              {conversation.sessionId}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Conversation
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversation.stats.messagesCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tokens Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversation.stats.totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(conversation.stats.totalCostCents)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <TimeAgo date={conversation.startedAt} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Site & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Site Name</p>
              <Link
                href={`/admin/sites/${conversation.site.id}`}
                className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"
              >
                {conversation.site.siteName}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-500">Site URL</p>
              <a
                href={conversation.site.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-700 dark:text-gray-300 hover:underline"
              >
                {conversation.site.siteUrl}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <Link
                href={`/admin/users/${conversation.site.user.id}`}
                className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"
              >
                {conversation.site.user.fullName || conversation.site.user.email}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Metadata */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Conversation Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Started</p>
                <p className="text-sm font-medium">{formatDate(conversation.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Message</p>
                <p className="text-sm font-medium">{formatDate(conversation.lastMessageAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Session ID</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                  {conversation.sessionId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">IP Address</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {conversation.ipAddress || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Thread ({conversation.messages.length} messages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 p-4 rounded-lg",
                    message.role === "USER"
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                      message.role === "USER"
                        ? "bg-blue-100 dark:bg-blue-800"
                        : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    {message.role === "USER" ? (
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant={message.role === "USER" ? "default" : "secondary"}>
                        {message.role === "USER" ? "User" : "Assistant"}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {message.tokensUsed && (
                          <span className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {message.tokensUsed} tokens
                          </span>
                        )}
                        <span>{formatDate(message.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Conversation"
        description={`Are you sure you want to delete this conversation with ${conversation.messages.length} messages? This action cannot be undone.`}
      />
    </div>
  );
}
