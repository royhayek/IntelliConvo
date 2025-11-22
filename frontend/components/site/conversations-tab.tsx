"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Search,
  BarChart3,
  Loader2,
  User,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalyticsMetricCard } from "@/components/ui/analytics-metric-card";
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { TopSiteItem } from "@/components/site/top-site-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useGetApiV1ConversationsAnalytics,
  useGetApiV1Conversations,
  useGetApiV1ConversationsConversationId,
} from "@/lib/api/generated/queries/conversations/conversations";
import {
  type SiteResponse,
  type Conversation,
  type Message,
} from "@/lib/api/generated/models";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ConversationsTabProps {
  site: SiteResponse;
}

export function ConversationsTab({ site }: ConversationsTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRange>("7d");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Map dateFilter to API period (API supports 7d, 30d, 90d, 1y)
  const getApiPeriod = (filter: DateRange): "7d" | "30d" | "90d" | "1y" => {
    switch (filter) {
      case "7d": return "7d";
      case "30d": return "30d";
      case "90d": return "90d";
      case "all": return "1y";
      default: return "30d";
    }
  };

  // Get analytics data - sync with dateFilter
  const { data: analytics, isLoading: analyticsLoading } = useGetApiV1ConversationsAnalytics({
    siteId: site.id,
    period: getApiPeriod(dateFilter),
  });

  // Chart configurations
  const conversationsChartConfig = {
    conversations: {
      label: "Conversations",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const messagesChartConfig = {
    messages: {
      label: "Messages",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Get conversations list
  const { data: conversationsData, isLoading: conversationsLoading } = useGetApiV1Conversations({
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
  const { data: selectedConversationData, isLoading: messagesLoading } = useGetApiV1ConversationsConversationId(
    selectedConversation || "",
    { query: { enabled: !!selectedConversation } }
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [selectedConversationData?.messages]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && filteredConversations.length > 0) {
      setSelectedConversation(filteredConversations[0].id || null);
    }
  }, [filteredConversations, selectedConversation]);

  const isLoading = analyticsLoading || conversationsLoading;

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
        title="Conversations & Analytics"
        description="Monitor conversations and analyze engagement patterns"
        action={<DateRangeFilter value={dateFilter} onChange={setDateFilter} />}
      />

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsMetricCard
            icon={MessageSquare}
            label="Total Conversations"
            value={analytics.overview?.totalConversations ?? 0}
            iconColor="blue"
          />
          <AnalyticsMetricCard
            icon={TrendingUp}
            label="Total Messages"
            value={analytics.overview?.totalMessages ?? 0}
            iconColor="green"
          />
          <AnalyticsMetricCard
            icon={BarChart3}
            label="Avg Messages/Conv"
            value={(analytics.overview?.averageMessagesPerConversation ?? 0).toFixed(1)}
            iconColor="purple"
          />
          <AnalyticsMetricCard
            icon={Users}
            label="Active Users"
            value={analytics.overview?.activeUsers ?? 0}
            iconColor="orange"
          />
        </div>
      )}

      {/* Charts */}
      {analytics && analytics.timeSeriesData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Conversations</CardTitle>
              <CardDescription>
                New conversations per day over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={conversationsChartConfig} className="h-[250px] w-full">
                <LineChart
                  data={analytics.timeSeriesData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="var(--color-conversations)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Messages</CardTitle>
              <CardDescription>
                Total messages sent per day over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={messagesChartConfig} className="h-[250px] w-full">
                <LineChart
                  data={analytics.timeSeriesData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--color-messages)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Sites - only shown when not filtering by specific site */}
      {analytics && analytics.topSites && analytics.topSites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topSites.slice(0, 5).map((site, index) => (
                <TopSiteItem
                  key={site.siteId}
                  rank={index + 1}
                  siteName={site.siteName}
                  conversationCount={site.conversationCount}
                  messageCount={site.messageCount}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List - Left Side */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
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
                        onClick={() => conversation.id && setSelectedConversation(conversation.id)}
                        className={cn(
                          "w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                          isSelected && "bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-l-indigo-600"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-indigo-100 dark:bg-indigo-900"
                              : "bg-gray-100 dark:bg-gray-700"
                          )}>
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {initials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                isSelected
                                  ? "text-indigo-900 dark:text-indigo-100"
                                  : "text-gray-900 dark:text-white"
                              )}>
                                {displayName}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatConversationDate(conversation.startedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {conversation.messageCount ?? 0} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Panel - Right Side */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50">
            {selectedConversation && selectedConversationData ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {(selectedConversationData.userIdentifier || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {selectedConversationData.userIdentifier || "Anonymous User"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Started {selectedConversationData.startedAt
                          ? new Date(selectedConversationData.startedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "N/A"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : selectedConversationData.messages && selectedConversationData.messages.length > 0 ? (
                    <div className="space-y-4">
                      {selectedConversationData.messages.map((message: Message) => {
                        const isUser = message.role === "USER";
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex items-end gap-2",
                              isUser ? "flex-row" : "flex-row-reverse"
                            )}
                          >
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                              isUser
                                ? "bg-gray-200 dark:bg-gray-700"
                                : "bg-indigo-600"
                            )}>
                              {isUser ? (
                                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              ) : (
                                <Bot className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className={cn(
                              "max-w-[70%] group"
                            )}>
                              <div className={cn(
                                "px-4 py-2.5 rounded-2xl text-sm",
                                isUser
                                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700"
                                  : "bg-indigo-600 text-white rounded-br-md"
                              )}>
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <p className={cn(
                                "text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                isUser ? "text-left" : "text-right",
                                "text-gray-500 dark:text-gray-400"
                              )}>
                                {formatMessageTime(message.timestamp)}
                              </p>
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
                </ScrollArea>
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