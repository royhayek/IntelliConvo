"use client";

import { useState } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Search,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsMetricCard } from "@/components/ui/analytics-metric-card";
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SectionHeader } from "@/components/ui/section-header";
import { ConversationListItem } from "@/components/site/conversation-list-item";
import { TopSiteItem } from "@/components/site/top-site-item";
import {
  useGetApiV1ConversationsAnalytics,
  useGetApiV1Conversations,
  useGetApiV1ConversationsSearch,
  useGetApiV1ConversationsConversationId,
} from "@/lib/api/generated/queries/conversations/conversations";
import {
  type SiteResponse,
  type Conversation,
  type MessageSearchResponseMessagesItem,
  type Message,
} from "@/lib/api/generated/models";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ConversationsTabProps {
  site: SiteResponse;
}

export function ConversationsTab({ site }: ConversationsTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRange>("7d");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate date range
  const endDate = new Date().toISOString();
  const startDate = new Date(
    Date.now() - (dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000
  ).toISOString();

  // Get analytics data
  const { data: analytics, isLoading: analyticsLoading } = useGetApiV1ConversationsAnalytics({
    siteId: site.id,
    period: "7d",
  });

  // Get conversations list
  const { data: conversationsData, isLoading: conversationsLoading } = useGetApiV1Conversations({
    siteId: site.id,
  });
  const conversations = conversationsData?.conversations || [];

  // Pagination logic
  const totalPages = Math.ceil(conversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConversations = conversations.slice(startIndex, endIndex);

  // Get search results
  const { data: searchResults } = useGetApiV1ConversationsSearch(
    { siteId: site.id, query: searchQuery, limit: "20" },
    { query: { enabled: searchQuery.length > 2 } }
  );

  // Selected conversation details
  const { data: selectedConversationData } = useGetApiV1ConversationsConversationId(
    selectedConversation || "",
    { query: { enabled: !!selectedConversation } }
  );

  const isLoading = analyticsLoading || conversationsLoading;

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
      {analytics && analytics.timeSeriesData && analytics.timeSeriesData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
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

      {/* Search and Conversation List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search & Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search Conversations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery.length > 2 && searchResults?.messages && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.messages.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No results found</p>
                ) : (
                  searchResults.messages.map((result: MessageSearchResponseMessagesItem) => (
                    <div key={result.id} className="p-3 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.conversation?.sessionId || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{result.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No conversations yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedConversations.map((conversation: Conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversationId={conversation.id || ""}
                      userIdentifier={conversation.userIdentifier}
                      messageCount={conversation.messageCount}
                      startedAt={conversation.startedAt}
                      isSelected={selectedConversation === conversation.id}
                      onClick={() => conversation.id && setSelectedConversation(conversation.id)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation Details */}
      {selectedConversation && selectedConversationData && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedConversationData.userIdentifier || "Anonymous User"}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Started: {selectedConversationData.startedAt ? new Date(selectedConversationData.startedAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Messages: {selectedConversationData.messageCount}
                  </p>
                </div>
              </div>

              {selectedConversationData.messages && selectedConversationData.messages.length > 0 && (
                <div className="border-t dark:border-gray-600 pt-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Messages</h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedConversationData.messages.map((message: Message) => (
                      <div key={message.id} className={`flex ${message.role === 'USER' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                          message.role === 'USER'
                            ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                            : 'bg-indigo-600 text-white'
                        }`}>
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'USER' ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-200'
                          }`}>
                            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}