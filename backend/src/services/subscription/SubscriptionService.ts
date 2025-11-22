/**
 * Subscription Service
 * Business logic for subscription management and billing
 */

import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { NotFoundError, AlreadyExistsError, ValidationError, InternalError } from '../../middleware/errors';
import { logger } from '../../utils/logger';
import {
  SubscriptionDTO,
  SubscriptionWithSiteDTO,
  SubscriptionListResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  SubscriptionPlanDTO,
  CustomerPortalResponse,
} from '../../dto/subscription.dto';
import { queueEmbeddingGeneration } from '../../queues';
import { cacheService, CacheNamespace, CacheTTL } from '../cache';

// Plan features mapping - kept locally since Stripe doesn't store rich feature lists
const PLAN_FEATURES: Record<string, string[]> = {
  PREMIUM_MONTHLY: [
    'Unlimited conversations',
    'Advanced analytics',
    'Custom branding',
    'Priority support',
    'API access',
  ],
  PREMIUM_ANNUAL: [
    'Unlimited conversations',
    'Advanced analytics',
    'Custom branding',
    'Priority support',
    'API access',
    '2 months free',
  ],
};

// Initialize Stripe - use test keys (sk_test_...) for sandbox environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Detect if running in Stripe test mode based on the API key
const isStripeTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false;

if (isStripeTestMode) {
  logger.info('🧪 Stripe running in TEST MODE - using sandbox environment');
} else {
  logger.info('💳 Stripe running in LIVE MODE');
}

/**
 * SubscriptionService class
 * Handles all subscription-related business logic
 */
export class SubscriptionService {
  /**
   * Get all subscriptions for a user
   * @param userId - User ID
   * @returns List of subscriptions with site information
   */
  async getUserSubscriptions(userId: string): Promise<SubscriptionListResponse> {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
          },
        },
      },
    });

    // Map to DTOs
    const subscriptionDTOs: SubscriptionWithSiteDTO[] = subscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      siteId: sub.siteId,
      planType: sub.planType,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt?.toISOString() || null,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      cancelledAt: sub.cancelledAt?.toISOString() || null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      site: sub.site,
    }));

    return { data: subscriptionDTOs };
  }

  /**
   * Create a new subscription
   * @param userId - User ID
   * @param data - Subscription creation data
   * @returns Created subscription with client secret (if applicable)
   */
  async createSubscription(
    userId: string,
    data: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> {
    const { siteId, planType, paymentMethodId } = data;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { siteId },
    });

    if (existingSubscription) {
      throw new AlreadyExistsError('Subscription', 'site');
    }

    // Create subscription via Stripe (uses test or live mode based on API key)
    return this.createStripeSubscription(userId, siteId, planType);
  }

  /**
   * Cancel a subscription
   * @param subscriptionId - Subscription ID
   * @param userId - User ID (for authorization)
   * @returns Updated subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string
  ): Promise<SubscriptionDTO> {
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    // Cancel in Stripe if we have a valid Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        logger.info(`Cancelled Stripe subscription: ${subscription.stripeSubscriptionId}`);
      } catch (error) {
        logger.error('Failed to cancel Stripe subscription:', error);
        // Continue with database update even if Stripe fails
      }
    }

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return this.mapSubscriptionToDTO(updatedSubscription);
  }

  /**
   * Get available subscription plans from Stripe
   * Fetches prices from Stripe API and caches them for performance
   * @returns List of available plans
   */
  async getAvailablePlans(): Promise<SubscriptionPlanDTO[]> {
    const cacheKey = 'available';

    // Try to get from cache first using getOrSet pattern
    const plans = await cacheService.getOrSet<SubscriptionPlanDTO[]>(
      CacheNamespace.SUBSCRIPTION_PLANS,
      cacheKey,
      async () => {
        return this.fetchPlansFromStripe();
      },
      CacheTTL.LONG // Cache for 1 hour
    );

    return plans || this.getFallbackPlans();
  }

  /**
   * Fetch plans directly from Stripe API
   * @returns List of plans from Stripe
   */
  private async fetchPlansFromStripe(): Promise<SubscriptionPlanDTO[]> {
    const priceIds = [
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_ANNUAL,
    ].filter(Boolean) as string[];

    if (priceIds.length === 0) {
      logger.warn('No Stripe price IDs configured, using fallback plans');
      return this.getFallbackPlans();
    }

    try {
      // Fetch prices with their associated products
      const prices = await Promise.all(
        priceIds.map((priceId) =>
          stripe.prices.retrieve(priceId, { expand: ['product'] })
        )
      );

      const plans: SubscriptionPlanDTO[] = prices
        .filter((price) => price.active)
        .map((price) => {
          const product = price.product as Stripe.Product;
          const planType = this.getPlanTypeFromPrice(price);
          // Convert Stripe's 'month'/'year' to 'monthly'/'annual'
          const interval: 'monthly' | 'annual' = price.recurring?.interval === 'year' ? 'annual' : 'monthly';

          return {
            id: planType,
            name: product.name,
            description: product.description || this.getDefaultDescription(planType),
            price: (price.unit_amount || 0) / 100, // Convert cents to dollars
            interval,
            features: PLAN_FEATURES[planType] || [],
          };
        });

      logger.info(`Fetched ${plans.length} plans from Stripe`);
      return plans;
    } catch (error) {
      logger.error('Failed to fetch plans from Stripe:', error);
      return this.getFallbackPlans();
    }
  }

  /**
   * Determine plan type from Stripe price
   */
  private getPlanTypeFromPrice(price: Stripe.Price): string {
    if (price.id === process.env.STRIPE_PRICE_MONTHLY) {
      return 'PREMIUM_MONTHLY';
    }
    if (price.id === process.env.STRIPE_PRICE_ANNUAL) {
      return 'PREMIUM_ANNUAL';
    }
    // Fallback based on interval
    return price.recurring?.interval === 'year' ? 'PREMIUM_ANNUAL' : 'PREMIUM_MONTHLY';
  }

  /**
   * Get default description for a plan type
   */
  private getDefaultDescription(planType: string): string {
    if (planType === 'PREMIUM_ANNUAL') {
      return 'Full access to all features, billed annually (save 20%)';
    }
    return 'Full access to all features, billed monthly';
  }

  /**
   * Fallback plans if Stripe fetch fails
   * Ensures the API never fails completely
   */
  private getFallbackPlans(): SubscriptionPlanDTO[] {
    return [
      {
        id: 'PREMIUM_MONTHLY',
        name: 'Premium Monthly',
        description: 'Full access to all features, billed monthly',
        price: 29,
        interval: 'monthly',
        features: PLAN_FEATURES['PREMIUM_MONTHLY'],
      },
      {
        id: 'PREMIUM_ANNUAL',
        name: 'Premium Annual',
        description: 'Full access to all features, billed annually (save 20%)',
        price: 279,
        interval: 'annual',
        features: PLAN_FEATURES['PREMIUM_ANNUAL'],
      },
    ];
  }

  /**
   * Invalidate plans cache (call when plans are updated in Stripe)
   */
  async invalidatePlansCache(): Promise<void> {
    await cacheService.delete(CacheNamespace.SUBSCRIPTION_PLANS, 'available');
    logger.info('Subscription plans cache invalidated');
  }

  /**
   * Get customer portal URL
   * @param subscriptionId - Subscription ID
   * @param userId - User ID (for authorization)
   * @returns Portal URL
   */
  async getCustomerPortalUrl(
    subscriptionId: string,
    userId: string
  ): Promise<CustomerPortalResponse> {
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    // Get user's billing info for Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { billingInfo: true },
    });

    if (!user?.billingInfo?.stripeCustomerId) {
      throw new ValidationError('No billing information found');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.billingInfo.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/subscriptions`,
    });

    return { url: session.url };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Create a Stripe Checkout Session for subscription
   * Uses Stripe's hosted checkout page for payment collection
   */
  private async createStripeSubscription(
    userId: string,
    siteId: string,
    planType: string
  ): Promise<CreateSubscriptionResponse> {

    // Get or create Stripe customer
    const customer = await this.getOrCreateStripeCustomer(userId);

    // Determine price ID based on plan type
    const priceId =
      planType === 'PREMIUM_MONTHLY'
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_ANNUAL;

    if (!priceId) {
      throw new InternalError('Stripe price ID not configured');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/onboarding?step=complete&siteId=${siteId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/onboarding?step=plan&siteId=${siteId}&canceled=true`,
      metadata: {
        userId,
        siteId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId,
          siteId,
          planType,
        },
      },
    });

    logger.info(`Created Stripe Checkout Session ${session.id} for user ${userId}, site ${siteId}`);

    // Return checkout URL - subscription will be created by webhook after payment
    return {
      subscription: null as any, // Will be created after payment via webhook
      checkoutUrl: session.url,
      testMode: isStripeTestMode,
    };
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { billingInfo: true },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Check if customer already exists
    if (user.billingInfo?.stripeCustomerId) {
      const customer = await stripe.customers.retrieve(user.billingInfo.stripeCustomerId);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName || undefined,
    });

    // Update billing info
    await prisma.billingInfo.upsert({
      where: { userId },
      create: {
        userId,
        fullName: user.fullName || user.email,
        email: user.email,
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        stripeCustomerId: customer.id,
      },
      update: {
        stripeCustomerId: customer.id,
      },
    });

    return customer;
  }

  /**
   * Map subscription to DTO
   */
  private mapSubscriptionToDTO(subscription: any): SubscriptionDTO {
    return {
      id: subscription.id,
      userId: subscription.userId,
      siteId: subscription.siteId,
      planType: subscription.planType,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelledAt: subscription.cancelledAt?.toISOString() || null,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
