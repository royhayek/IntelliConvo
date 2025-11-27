/**
 * Conversation Data Transfer Objects (DTOs)
 * Type definitions for conversation-related API requests and responses
 */

/**
 * Basic conversation information
 */
export interface ConversationDTO {
  id: string;
  siteId: string;
  sessionId: string;
  userIdentifier: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
}

/**
 * Conversation with site information
 */
export interface ConversationWithSiteDTO extends ConversationDTO {
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
  };
}

/**
 * Message in a conversation
 */
export interface MessageDTO {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
  tokensUsed: number | null;
  costInCents: number | null;
}

/**
 * Conversation with full message history
 */
export interface ConversationDetailsDTO extends ConversationDTO {
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
  };
  messages: MessageDTO[];
}

/**
 * Conversation list response
 */
export interface ConversationListResponse {
  conversations: ConversationWithSiteDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Conversation analytics overview
 */
export interface ConversationAnalyticsOverview {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  activeUsers: number;
}

/**
 * Time series data point for analytics
 */
export interface ConversationTimeSeriesPoint {
  date: string;
  conversations: number;
  messages: number;
}

/**
 * Top site statistics
 */
export interface TopSiteStats {
  siteId: string;
  siteName: string;
  conversationCount: number;
  messageCount: number;
}

/**
 * Complete conversation analytics response
 */
export interface ConversationAnalyticsResponse {
  overview: ConversationAnalyticsOverview;
  timeSeriesData: ConversationTimeSeriesPoint[];
  topSites: TopSiteStats[];
}

/**
 * Message search result
 */
export interface MessageSearchResult {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  timestamp: string;
  conversation: {
    id: string;
    sessionId: string;
    site: {
      id: string;
      siteName: string;
    };
  };
}

/**
 * Message search response
 */
export interface MessageSearchResponse {
  messages: MessageSearchResult[];
  total: number;
}

/**
 * Conversation query parameters
 */
export interface ConversationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  siteId?: string;
}

/**
 * Message search query parameters
 */
export interface MessageSearchQueryParams {
  query: string;
  siteId?: string;
  limit?: number;
}
