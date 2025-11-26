/**
 * Site Data Transfer Objects (DTOs)
 * Type definitions for site-related API requests and responses
 */

import { CrawlStatus } from '@prisma/client';

/**
 * Basic site information
 */
export interface SiteDTO {
  id: string;
  userId: string;
  siteUrl: string;
  siteName: string;
  faviconUrl: string | null;
  siteDescription: string | null;
  siteIndustry: string | null;
  specialInstructions: string | null;
  startersHeadline: string;
  crawlStatus: CrawlStatus;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription summary for site
 */
export interface SiteSubscriptionSummary {
  id: string;
  status: string;
  planType: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

/**
 * Site with counts and subscription
 */
export interface SiteWithMetaDTO extends Omit<SiteDTO, 'userId'> {
  urlCount: number;
  subscription: SiteSubscriptionSummary | null;
  _count?: {
    urls: number;
    conversations: number;
    knowledgeFiles: number;
  };
}

/**
 * Site list response
 */
export interface SiteListResponse {
  data: SiteWithMetaDTO[];
}

/**
 * Site details response
 */
export interface SiteDetailsResponse {
  data: SiteWithMetaDTO;
}

/**
 * Create site request
 */
export interface CreateSiteRequest {
  siteUrl: string;
  siteName?: string;
  siteDescription?: string;
  siteIndustry?: string;
}

/**
 * Update site request
 */
export interface UpdateSiteRequest {
  siteName?: string;
  siteDescription?: string;
  siteIndustry?: string;
  specialInstructions?: string;
  startersHeadline?: string;
}

/**
 * Conversation starter
 */
export interface ConversationStarterDTO {
  id: string;
  siteId: string;
  starterText: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Starters response
 */
export interface StartersResponse {
  startersHeadline: string | null;
  starters: ConversationStarterDTO[];
}

/**
 * Update starters request
 */
export interface UpdateStartersRequest {
  startersHeadline?: string | null;
  starters: string[];
}

/**
 * Active host
 */
export interface ActiveHostDTO {
  id: string;
  siteId: string;
  hostName: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hosts response
 */
export interface HostsResponse {
  hosts: ActiveHostDTO[];
}

/**
 * Add host request
 */
export interface AddHostRequest {
  hostName: string;
  isEnabled?: boolean;
}

/**
 * Site analytics
 */
export interface SiteAnalytics {
  totalUrls: number;
  activeUrls: number;
  totalConversations: number;
  totalMessages: number;
  lastCrawledAt: string | null;
}
