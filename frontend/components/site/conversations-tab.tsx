"use client";

import { useState } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Search,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetApiConversationsAnalytics,
  useGetApiConversations,
  useGetApiConversationsSearch,
  useGetApiConversationsConversationId,
} from "@/lib/api/generated/queries/conversations/conversations";
import {
  type GetApiSitesSiteId200,
  type GetApiConversations200ConversationsItem,
} from "@/lib/api/generated/models";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ConversationsTabProps {
  site: GetApiSitesSiteId200;
}

export function ConversationsTab({ site }: ConversationsTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"7d" | "30d" | "90d">("7d");

  // Calculate date range
  const endDate = new Date().toISOString();
  const startDate = new Date(
    Date.now() - (dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000
  ).toISOString();

  // Get analytics data
  const { data: analytics, isLoading: analyticsLoading } = useGetApiConversationsAnalytics({
    siteId: site.id,
    period: "7d",
  });

  // Get conversations list
  const { data: conversationsData, isLoading: conversationsLoading } = useGetApiConversations({
    siteId: site.id,
  });
  const conversations = conversationsData?.conversations || [];

  // Get search results
  const { data: searchResults } = useGetApiConversationsSearch(
    { siteId: site.id, query: searchQuery, limit: 20 },
    { query: { enabled: searchQuery.length > 2 } }
  );

  // Selected conversation details
  const { data: selectedConversationData } = useGetApiConversationsConversationId(
    selectedConversation || "",
    { query: { enabled: !!selectedConversation } }
  );

  const isLoading = analyticsLoading || conversationsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Conversations & Analytics</h2>
          <p className="text-gray-600">Monitor conversations and analyze engagement patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("7d")}
            className={dateFilter === "7d" ? "bg-indigo-50 border-indigo-200" : ""}
          >
            7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("30d")}
            className={dateFilter === "30d" ? "bg-indigo-50 border-indigo-200" : ""}
          >
            30 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("90d")}
            className={dateFilter === "90d" ? "bg-indigo-50 border-indigo-200" : ""}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.overview?.totalConversations ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.overview?.totalMessages ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Messages/Conv</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.overview?.averageMessagesPerConversation ?? 0).toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(analytics.overview?.activeUsers ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <div key={site.siteId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {site.siteName || "Unknown Site"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {site.conversationCount} conversations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{site.messageCount} messages</p>
                  </div>
                </div>
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
                  <p className="text-sm text-gray-600 text-center py-4">No results found</p>
                ) : (
                  searchResults.messages.map((result) => (
                    <div key={result.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">
                        {(result.conversation as any)?.userIdentifier || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{result.content}</p>
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
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {conversations.slice(0, 10).map((conversation: GetApiConversations200ConversationsItem) => (
                  <button
                    key={conversation.id}
                    onClick={() => conversation.id && setSelectedConversation(conversation.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation === conversation.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {(conversation.userIdentifier || "A").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conversation.userIdentifier || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {conversation.messageCount} messages
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {conversation.startedAt ? new Date(conversation.startedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
                  <h4 className="font-medium text-gray-900">
                    {selectedConversationData.userIdentifier || "Anonymous User"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Started: {selectedConversationData.startedAt ? new Date(selectedConversationData.startedAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Messages: {selectedConversationData.messageCount}
                  </p>
                </div>
              </div>

              {selectedConversationData.messages && selectedConversationData.messages.length > 0 && (
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Messages</h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedConversationData.messages.map((message: any) => (
                      <div key={message.id} className={`flex ${message.role === 'USER' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                          message.role === 'USER'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-indigo-600 text-white'
                        }`}>
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'USER' ? 'text-gray-500' : 'text-indigo-200'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
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