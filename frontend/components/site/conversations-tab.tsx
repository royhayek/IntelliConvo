"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Loader2,
  User,
  Bot,
  ArrowLeft,
  UserCog,
  Clock,
  AlertCircle,
  DollarSign,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { cn, formatCents } from "@/lib/utils";
import {
  useGetConversations,
  useGetConversationsConversationId,
} from "@/lib/api/generated/queries/conversations/conversations";
import {
  type SiteResponse,
  type Conversation,
  type Message,
} from "@/lib/api/generated/models";

interface ConversationsTabProps {
  site: SiteResponse;
}

export function ConversationsTab({ site }: ConversationsTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMessages, setShowMessages] = useState(false); // Toggle for mobile view
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get conversations list
  const { data: conversationsData, isLoading: conversationsLoading } = useGetConversations({
    siteId: site.id,
  });
  const conversations = conversationsData?.conversations || [];

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation: Conversation) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const userIdentifier = conversation.userIdentifier?.toLowerCase() || "";
    return userIdentifier.includes(searchLower);
  });

  // Selected conversation details
  const { data: selectedConversationData, isLoading: messagesLoading } = useGetConversationsConversationId(
    selectedConversation || "",
    { query: { enabled: !!selectedConversation } }
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [selectedConversationData?.messages]);

  // Auto-select first conversation if none selected (desktop only)
  useEffect(() => {
    if (!selectedConversation && filteredConversations.length > 0 && window.innerWidth >= 640) {
      setSelectedConversation(filteredConversations[0].id || null);
    }
  }, [filteredConversations, selectedConversation]);

  // Handle conversation selection on mobile
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    if (window.innerWidth < 640) {
      setShowMessages(true);
    }
  };

  // Handle back button on mobile
  const handleBack = () => {
    setShowMessages(false);
  };

  const formatMessageTime = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatConversationDate = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Conversations"
        description="View and manage conversations with your visitors"
      />

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row h-[600px]">
          {/* Conversations List - Left Side */}
          <div className={cn(
            "w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0",
            showMessages && "hidden sm:flex"
          )}>
            {/* Search Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm h-9"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredConversations.map((conversation: Conversation) => {
                    const isSelected = selectedConversation === conversation.id;
                    const initials = (conversation.userIdentifier || "A").charAt(0).toUpperCase();
                    const displayName = conversation.userIdentifier || "Anonymous";

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => conversation.id && handleConversationSelect(conversation.id)}
                        className={cn(
                          "w-full p-2.5 sm:p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                          isSelected && "bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-l-indigo-600"
                        )}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-indigo-100 dark:bg-indigo-900"
                              : "bg-gray-100 dark:bg-gray-700"
                          )}>
                            <span className={cn(
                              "text-xs sm:text-sm font-medium",
                              isSelected
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {initials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className={cn(
                                  "text-xs sm:text-sm font-medium truncate",
                                  isSelected
                                    ? "text-indigo-900 dark:text-indigo-100"
                                    : "text-gray-900 dark:text-white"
                                )}>
                                  {displayName}
                                </p>
                                {conversation.status === "NEEDS_AGENT" && (
                                  <span className="flex-shrink-0 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                )}
                                {conversation.status === "AGENT_ACTIVE" && (
                                  <UserCog className="flex-shrink-0 h-3 w-3 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatConversationDate(conversation.startedAt)}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                              {conversation.messageCount ?? 0} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Messages Panel - Right Side */}
          <div className={cn(
            "flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 min-h-0",
            !showMessages && "hidden sm:flex"
          )}>
            {selectedConversation && selectedConversationData ? (
              <>
                {/* Conversation Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={handleBack}
                      className="sm:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {(selectedConversationData.userIdentifier || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                          {selectedConversationData.userIdentifier || "Anonymous User"}
                        </h3>
                        {selectedConversationData.status && (
                          <span className={cn(
                            "text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium",
                            selectedConversationData.status === "ACTIVE" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                            selectedConversationData.status === "NEEDS_AGENT" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                            selectedConversationData.status === "AGENT_ACTIVE" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                            selectedConversationData.status === "RESOLVED" && "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          )}>
                            {selectedConversationData.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started {selectedConversationData.startedAt
                            ? new Date(selectedConversationData.startedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: window.innerWidth < 640 ? undefined : "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "N/A"
                          }
                        </span>
                        {selectedConversationData.assignedAgent && (
                          <span className="flex items-center gap-1">
                            <UserCog className="h-3 w-3" />
                            {selectedConversationData.assignedAgent.fullName || selectedConversationData.assignedAgent.email}
                          </span>
                        )}
                      </div>
                      {selectedConversationData.escalationReason && (
                        <div className="flex items-start gap-1 mt-1 p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded text-[10px] sm:text-xs text-orange-700 dark:text-orange-300">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{selectedConversationData.escalationReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }} ref={scrollAreaRef as any}>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : selectedConversationData.messages && selectedConversationData.messages.length > 0 ? (
                    <div className="space-y-4">
                      {selectedConversationData.messages.map((message: Message) => {
                        const isUser = message.role === "USER";
                        const isAgent = message.role === "AGENT";
                        const isAssistant = message.role === "ASSISTANT";

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex items-end gap-1.5 sm:gap-2",
                              isUser ? "flex-row-reverse" : "flex-row"
                            )}
                          >
                            <div className={cn(
                              "h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0",
                              isUser && "bg-indigo-600",
                              isAgent && "bg-green-600",
                              isAssistant && "bg-gray-600 dark:bg-gray-700"
                            )}>
                              {isUser ? (
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              ) : isAgent ? (
                                <UserCog className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              ) : (
                                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              )}
                            </div>
                            <div className={cn(
                              "max-w-[75%] sm:max-w-[70%] group"
                            )}>
                              <div className={cn(
                                "px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm",
                                isUser && "bg-indigo-600 text-white rounded-br-md",
                                isAgent && "bg-green-600 text-white rounded-bl-md",
                                isAssistant && "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700"
                              )}>
                                {isAgent && message.agentId && (
                                  <div className="flex items-center gap-1 mb-1 pb-1 border-b border-green-400/30">
                                    <UserCog className="h-3 w-3" />
                                    <span className="text-[10px] font-medium opacity-90">
                                      Agent
                                    </span>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <div className={cn(
                                "flex items-center gap-2 text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                                isUser ? "flex-row-reverse" : "flex-row",
                                "text-gray-500 dark:text-gray-400"
                              )}>
                                <span>{formatMessageTime(message.timestamp)}</span>
                                {(message.tokensUsed || message.costInCents) && (
                                  <span className="flex items-center gap-1">
                                    {message.tokensUsed && (
                                      <span className="flex items-center gap-0.5">
                                        <Zap className="h-2.5 w-2.5" />
                                        {message.tokensUsed}
                                      </span>
                                    )}
                                    {message.costInCents && (
                                      <span className="flex items-center gap-0.5">
                                        <DollarSign className="h-2.5 w-2.5" />
                                        {formatCents(message.costInCents)}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No messages in this conversation</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
