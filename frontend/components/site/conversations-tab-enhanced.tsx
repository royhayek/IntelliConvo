"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Loader2,
  User,
  Bot,
  ArrowLeft,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import {
  useGetConversations,
  useGetConversationsConversationId,
} from "@/lib/api/generated/queries/conversations/conversations";
import { type SiteResponse, type ConversationDetailsResponse } from "@/lib/api/generated/models";
import { useConversationSocket } from "@/lib/hooks/useConversationSocket";
import { useQueryClient } from "@tanstack/react-query";

interface ConversationsTabProps {
  site: SiteResponse;
  userId?: string; // Current user ID for agent actions
}

export function ConversationsTabEnhanced({ site, userId }: ConversationsTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Get conversations list
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useGetConversations({
    siteId: site.id,
  });
  const conversations = conversationsData?.conversations || [];

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const userIdentifier = conversation.userIdentifier?.toLowerCase() || "";
    return userIdentifier.includes(searchLower);
  });

  // Selected conversation details
  const {
    data: conversationDetails,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetConversationsConversationId(selectedConversation || "", {
    query: { enabled: !!selectedConversation },
  });

  // Socket.IO real-time updates
  const {
    takeConversation,
    sendAgentMessage: sendAgentMessageSocket,
    setAgentTyping: setAgentTypingSocket,
    resolveConversation,
  } = useConversationSocket({
    siteId: site.id,
    conversationId: selectedConversation || undefined,
    onConversationEscalated: useCallback(() => {
      // Refresh conversations list when new escalation occurs
      refetchConversations();
    }, [refetchConversations]),
    onConversationStatusChanged: useCallback(() => {
      // Refresh both lists when status changes
      refetchConversations();
      if (selectedConversation) {
        refetchMessages();
      }
    }, [refetchConversations, refetchMessages, selectedConversation]),
    onConversationMessage: useCallback(
      (message: any) => {
        // Refresh messages when new message arrives
        if (selectedConversation) {
          refetchMessages();
        }
        refetchConversations();
      },
      [refetchMessages, refetchConversations, selectedConversation]
    ),
    onAgentJoined: useCallback(() => {
      refetchConversations();
      if (selectedConversation) {
        refetchMessages();
      }
    }, [refetchConversations, refetchMessages, selectedConversation]),
    onAgentTyping: useCallback((data: { isTyping: boolean }) => {
      setAgentTyping(data.isTyping);
    }, []),
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversationDetails?.messages]);

  // Auto-select first conversation if none selected (desktop only)
  useEffect(() => {
    if (!selectedConversation && filteredConversations.length > 0 && window.innerWidth >= 640) {
      setSelectedConversation(filteredConversations[0].id || null);
    }
  }, [filteredConversations, selectedConversation]);

  // Handle conversation selection
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

  // Handle taking a conversation
  const handleTakeConversation = async () => {
    console.log("🎯 handleTakeConversation called", { selectedConversation, userId });

    if (!selectedConversation) {
      console.error("❌ No conversation selected");
      return;
    }

    if (!userId) {
      console.error("❌ No userId available");
      return;
    }

    try {
      console.log("📤 Calling takeConversation with:", { selectedConversation, userId });
      takeConversation(selectedConversation, userId);
      // Refetch to update UI
      setTimeout(() => {
        refetchConversations();
        refetchMessages();
      }, 500);
    } catch (error) {
      console.error("Error taking conversation:", error);
    }
  };

  // Handle sending agent message
  const handleSendMessage = async () => {
    if (!selectedConversation || !userId || !agentMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      sendAgentMessageSocket(selectedConversation, userId, agentMessage.trim());
      setAgentMessage("");

      // Refetch messages after sending
      setTimeout(() => {
        refetchMessages();
        refetchConversations();
      }, 500);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle agent typing
  const handleTyping = () => {
    if (!selectedConversation) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    setAgentTypingSocket(selectedConversation, true);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setAgentTypingSocket(selectedConversation, false);
    }, 2000);
  };

  // Handle resolving conversation
  const handleResolveConversation = async () => {
    if (!selectedConversation || !userId) return;

    if (confirm("Are you sure you want to mark this conversation as resolved?")) {
      try {
        resolveConversation(selectedConversation, userId);

        // Refetch to update UI
        setTimeout(() => {
          refetchConversations();
          refetchMessages();
        }, 500);
      } catch (error) {
        console.error("Error resolving conversation:", error);
      }
    }
  };

  // Format timestamps
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

  // Get conversation status badge
  const getStatusBadge = (conversation: any) => {
    const status = conversation.status || "ACTIVE";

    switch (status) {
      case "NEEDS_AGENT":
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Agent
          </Badge>
        );
      case "AGENT_ACTIVE":
        return (
          <Badge variant="default" className="text-xs bg-green-600">
            <UserCheck className="h-3 w-3 mr-1" />
            Agent Active
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <Bot className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
        );
    }
  };

  // Check if current user can interact with conversation
  const canInteract = conversationDetails?.status === "AGENT_ACTIVE" && conversationDetails?.assignedAgentId === userId;
  const canTake = conversationDetails?.status === "NEEDS_AGENT";
  const canResolve = canInteract;

  return (
    <div className="space-y-6">
      <SectionHeader title="Conversations" description="View and manage conversations with your visitors" />

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row h-[600px]">
          {/* Conversations List - Left Side */}
          <div
            className={cn(
              "w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0",
              showMessages && "hidden sm:flex"
            )}
          >
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
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
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
                  {filteredConversations.map((conversation: any) => {
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
                          <div
                            className={cn(
                              "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-indigo-100 dark:bg-indigo-900" : "bg-gray-100 dark:bg-gray-700"
                            )}
                          >
                            <span
                              className={cn(
                                "text-xs sm:text-sm font-medium",
                                isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
                              )}
                            >
                              {initials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                              <p
                                className={cn(
                                  "text-xs sm:text-sm font-medium truncate",
                                  isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-gray-900 dark:text-white"
                                )}
                              >
                                {displayName}
                              </p>
                              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatConversationDate(conversation.startedAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                {conversation.messageCount ?? 0} messages
                              </p>
                              {getStatusBadge(conversation)}
                            </div>
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
          <div
            className={cn(
              "flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 min-h-0",
              !showMessages && "hidden sm:flex"
            )}
          >
            {selectedConversation && conversationDetails ? (
              <>
                {/* Conversation Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <button
                        onClick={handleBack}
                        className="sm:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300">
                          {(conversationDetails.userIdentifier || "A").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                          {conversationDetails.userIdentifier || "Anonymous User"}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getStatusBadge(conversationDetails)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {canTake && (
                        <Button size="sm" onClick={handleTakeConversation} className="text-xs">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Take
                        </Button>
                      )}
                      {canResolve && (
                        <Button size="sm" variant="outline" onClick={handleResolveConversation} className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 overscroll-contain"
                  style={{ WebkitOverflowScrolling: "touch" }}
                  ref={scrollAreaRef as any}
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : conversationDetails.messages && conversationDetails.messages.length > 0 ? (
                    <div className="space-y-4">
                      {conversationDetails.messages.map((message) => {
                        const isUser = message.role === "USER";
                        const isAgent = message.role === "AGENT";
                        const isAI = message.role === "ASSISTANT";

                        return (
                          <div
                            key={message.id}
                            className={cn("flex items-end gap-1.5 sm:gap-2", isUser ? "flex-row" : "flex-row-reverse")}
                          >
                            <div
                              className={cn(
                                "h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                isUser && "bg-gray-200 dark:bg-gray-700",
                                isAI && "bg-indigo-600",
                                isAgent && "bg-green-600"
                              )}
                            >
                              {isUser && <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-300" />}
                              {isAI && <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                              {isAgent && <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                            </div>
                            <div className={cn("max-w-[75%] sm:max-w-[70%] group")}>
                              <div
                                className={cn(
                                  "px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm",
                                  isUser &&
                                    "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700",
                                  isAI && "bg-indigo-600 text-white rounded-br-md",
                                  isAgent && "bg-green-600 text-white rounded-br-md"
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <p
                                className={cn(
                                  "text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                                  isUser ? "text-left" : "text-right",
                                  "text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {formatMessageTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Agent typing indicator */}
                      {agentTyping && (
                        <div className="flex items-end gap-2 flex-row-reverse">
                          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-green-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
                            <div className="flex gap-1">
                              <span
                                className="w-2 h-2 bg-white rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></span>
                              <span
                                className="w-2 h-2 bg-white rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></span>
                              <span
                                className="w-2 h-2 bg-white rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No messages in this conversation</p>
                    </div>
                  )}
                </div>

                {/* Agent Reply Input */}
                {canInteract && (
                  <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={agentMessage}
                        onChange={(e) => {
                          setAgentMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                        rows={2}
                      />
                      <Button onClick={handleSendMessage} disabled={!agentMessage.trim() || isSendingMessage}>
                        {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Select a conversation</h3>
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
