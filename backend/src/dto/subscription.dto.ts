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
  cancelAtPeriodEnd: boolean;
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
  returnUrl?: string;
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
  currency: string;
  interval: 'monthly' | 'annual';
  features: string[];
  trialDays?: number;
}

/**
 * Response for customer portal
 */
export interface CustomerPortalResponse {
  url: string;
}

/**
 * Request for changing subscription plan
 */
export interface ChangePlanRequest {
  newPlanType: PlanType;
}

/**
 * Proration preview for plan change
 */
export interface ProrationPreviewDTO {
  currentPlan: {
    id: string;
    name: string;
    price: number;
  };
  newPlan: {
    id: string;
    name: string;
    price: number;
  };
  prorationAmount: number;
  creditAmount: number;
  amountDue: number;
  currency: string;
  effectiveDate: string;
  billingCycleAnchor: string;
}

/**
 * Response for changing subscription plan
 */
export interface ChangePlanResponse {
  subscription: SubscriptionDTO;
  proration: ProrationPreviewDTO;
}
