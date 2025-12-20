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
  UserCog,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency, formatCents, formatDateTime } from "@/lib/utils";
import {
  useGetAdminConversationsConversationId,
  useDeleteAdminConversationsConversationId,
  getGetAdminConversationsQueryKey,
} from "@/lib/api/generated/queries/admin-conversations/admin-conversations";
import type { AdminConversationDetail } from "@/lib/api/generated/models";

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
  } = useGetAdminConversationsConversationId(conversationId);

  // Use the AdminConversationDetail type from the generated API
  const conversation: AdminConversationDetail | undefined = response?.data;

  // Delete mutation
  const deleteMutation = useDeleteAdminConversationsConversationId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [getGetAdminConversationsQueryKey()[0]],
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
            <p className="text-2xl font-bold">{formatCents(conversation.stats.totalCostCents)}</p>
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
                <p className="text-sm font-medium">{formatDateTime(conversation.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Message</p>
                <p className="text-sm font-medium">{formatDateTime(conversation.lastMessageAt)}</p>
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
              <div className="col-span-2">
                <p className="text-xs text-gray-500">User Agent (Browser/Device)</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                  {conversation.userAgent || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Human Handoff Information - Only show if conversation has been escalated or has agent */}
      {(conversation.status && conversation.status !== 'ACTIVE' || conversation.assignedAgent) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Human Handoff Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              {conversation.status && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      conversation.status === "ACTIVE" && "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300",
                      conversation.status === "NEEDS_AGENT" && "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300",
                      conversation.status === "AGENT_ACTIVE" && "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300",
                      conversation.status === "RESOLVED" && "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300"
                    )}
                  >
                    {conversation.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              )}

              {/* Assigned Agent */}
              {conversation.assignedAgent && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned Agent</p>
                  <Link
                    href={`/admin/users/${conversation.assignedAgent.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {conversation.assignedAgent.fullName || conversation.assignedAgent.email}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Escalated At */}
              {conversation.escalatedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Escalated At</p>
                  <p className="text-sm font-medium">{formatDateTime(conversation.escalatedAt)}</p>
                </div>
              )}

              {/* Agent Joined At */}
              {conversation.agentJoinedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Agent Joined At</p>
                  <p className="text-sm font-medium">{formatDateTime(conversation.agentJoinedAt)}</p>
                </div>
              )}

              {/* Resolved At */}
              {conversation.resolvedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Resolved At
                  </p>
                  <p className="text-sm font-medium">{formatDateTime(conversation.resolvedAt)}</p>
                </div>
              )}

              {/* Escalation Reason */}
              {conversation.escalationReason && (
                <div className="col-span-full">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Escalation Reason
                  </p>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-900 dark:text-orange-200">{conversation.escalationReason}</p>
                  </div>
                </div>
              )}

              {/* Agent Notes */}
              {conversation.agentNotes && (
                <div className="col-span-full">
                  <p className="text-xs text-gray-500 mb-1">Agent Notes (Private)</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap">{conversation.agentNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              {conversation.messages.map((message) => {
                const isUser = message.role === "USER";
                const isAgent = message.role === "AGENT";
                const isAssistant = message.role === "ASSISTANT";

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        isUser && "bg-blue-100 dark:bg-blue-800",
                        isAgent && "bg-green-100 dark:bg-green-800",
                        isAssistant && "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      {isUser ? (
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      ) : isAgent ? (
                        <UserCog className="h-4 w-4 text-green-600 dark:text-green-300" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </div>
                    <div className={cn(
                      "flex flex-col max-w-[75%]",
                      isUser ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-lg",
                        isUser && "bg-blue-50 dark:bg-blue-900/20",
                        isAgent && "bg-green-50 dark:bg-green-900/20",
                        isAssistant && "bg-gray-50 dark:bg-gray-800/50"
                      )}>
                        <div className={cn(
                          "flex items-center gap-2 mb-2",
                          isUser ? "flex-row-reverse" : "flex-row"
                        )}>
                          <Badge
                            variant={isUser ? "default" : isAgent ? "outline" : "secondary"}
                            className={cn(
                              isAgent && "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                            )}
                          >
                            {isUser ? "User" : isAgent ? "Agent" : "Assistant"}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {message.tokensUsed && (
                              <span className="flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                {message.tokensUsed}
                              </span>
                            )}
                            {message.costInCents && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCents(message.costInCents)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 px-1">
                        {formatDateTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
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
