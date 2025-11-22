/**
 * Subscription Data Transfer Objects
 * TypeScript interfaces for subscription-related API responses
 */

import { PlanType, SubscriptionStatus } from '@prisma/client';

/**
 * Basic subscription information
 */
export interface SubscriptionDTO {
  id: string;
  userId: string;
  siteId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription with site information
 */
export interface SubscriptionWithSiteDTO extends SubscriptionDTO {
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
  };
}

/**
 * Response for listing subscriptions
 */
export interface SubscriptionListResponse {
  data: SubscriptionWithSiteDTO[];
}

/**
 * Request for creating a subscription
 */
export interface CreateSubscriptionRequest {
  siteId: string;
  planType: PlanType;
  paymentMethodId?: string;
}

/**
 * Response for creating a subscription
 */
export interface CreateSubscriptionResponse {
  subscription: SubscriptionDTO | null;
  clientSecret?: string | null;
  checkoutUrl?: string | null;
  testMode?: boolean;
}

/**
 * Subscription plan information
 */
export interface SubscriptionPlanDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
}

/**
 * Response for customer portal
 */
export interface CustomerPortalResponse {
  url: string;
}
