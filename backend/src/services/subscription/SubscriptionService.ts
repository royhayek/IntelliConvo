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
  ChangePlanRequest,
  ChangePlanResponse,
  ProrationPreviewDTO,
} from '../../dto/subscription.dto';
import { queueEmbeddingGeneration } from '../../queues';
import { cacheService, CacheNamespace, CacheTTL } from '../cache';
import { settings } from '../../lib/settings';

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
   * @param siteId - Optional site ID to filter by specific site
   * @returns List of subscriptions with site information
   */
  async getUserSubscriptions(userId: string, siteId?: string): Promise<SubscriptionListResponse> {
    const where: { userId: string; siteId?: string } = { userId };

    if (siteId) {
      where.siteId = siteId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
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
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
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
    const { siteId, planType, paymentMethodId, returnUrl } = data;

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

    // Check if an ACTIVE or TRIAL subscription already exists
    // Allow creating new subscription if existing one is CANCELLED or EXPIRED
    const existingSubscription = await prisma.subscription.findUnique({
      where: { siteId },
    });

    if (existingSubscription && ['ACTIVE', 'TRIAL'].includes(existingSubscription.status)) {
      throw new AlreadyExistsError('Subscription', 'site');
    }

    // Note: We do NOT delete cancelled/expired subscriptions here.
    // The old subscription will be replaced in the webhook handler after payment is confirmed.
    // This prevents data loss if the user abandons the checkout.
    if (existingSubscription && ['CANCELLED', 'EXPIRED'].includes(existingSubscription.status)) {
      logger.info(`Site ${siteId} has ${existingSubscription.status} subscription - will be replaced after successful payment`);
    }

    // Create subscription via Stripe (uses test or live mode based on API key)
    return this.createStripeSubscription(userId, siteId, planType, returnUrl);
  }

  /**
   * Cancel a subscription (schedules cancellation at period end)
   * The subscription remains active until the current billing period ends.
   * Use reactivateSubscription() to undo this before the period ends.
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
        logger.info(`Scheduled Stripe subscription for cancellation: ${subscription.stripeSubscriptionId}`);
      } catch (error) {
        logger.error('Failed to cancel Stripe subscription:', error);
        throw new InternalError('Failed to cancel subscription with payment provider');
      }
    }

    // Update subscription - mark as pending cancellation but keep status as-is
    // The status will change to CANCELLED when Stripe sends customer.subscription.deleted webhook
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        // Don't set status to CANCELLED yet - subscription is still active until period ends
      },
    });

    return this.mapSubscriptionToDTO(updatedSubscription);
  }

  /**
   * Reactivate a subscription that was scheduled for cancellation
   * Only works if cancelAtPeriodEnd is true and subscription hasn't been deleted yet
   * @param subscriptionId - Subscription ID
   * @param userId - User ID (for authorization)
   * @returns Updated subscription
   */
  async reactivateSubscription(
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

    // Can only reactivate if pending cancellation
    if (!subscription.cancelAtPeriodEnd) {
      throw new ValidationError('Subscription is not scheduled for cancellation');
    }

    // Reactivate in Stripe if we have a valid Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        logger.info(`Reactivated Stripe subscription: ${subscription.stripeSubscriptionId}`);
      } catch (error) {
        logger.error('Failed to reactivate Stripe subscription:', error);
        throw new InternalError('Failed to reactivate subscription with payment provider');
      }
    }

    // Update subscription - clear the pending cancellation
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt: null,
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
      const [prices, currency, trialDays] = await Promise.all([
        Promise.all(
          priceIds.map((priceId) =>
            stripe.prices.retrieve(priceId, { expand: ['product'] })
          )
        ),
        settings.getCurrency(),
        settings.getTrialDays(),
      ]);

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
            currency: price.currency?.toUpperCase() || currency,
            interval,
            features: PLAN_FEATURES[planType] || [],
            trialDays: trialDays > 0 ? trialDays : undefined,
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
   * Note: This is sync, so we use defaults for currency/trial. Real values come from Stripe.
   */
  private getFallbackPlans(): SubscriptionPlanDTO[] {
    return [
      {
        id: 'PREMIUM_MONTHLY',
        name: 'Premium Monthly',
        description: 'Full access to all features, billed monthly',
        price: 29,
        currency: 'USD',
        interval: 'monthly',
        features: PLAN_FEATURES['PREMIUM_MONTHLY'],
      },
      {
        id: 'PREMIUM_ANNUAL',
        name: 'Premium Annual',
        description: 'Full access to all features, billed annually (save 20%)',
        price: 279,
        currency: 'USD',
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

    // Create portal session with siteId in return URL to preserve context
    const session = await stripe.billingPortal.sessions.create({
      customer: user.billingInfo.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/subscriptions?siteId=${subscription.siteId}`,
    });

    return { url: session.url };
  }

  /**
   * Change subscription plan (upgrade or downgrade)
   * Uses Stripe's proration to handle billing adjustments
   * @param subscriptionId - Subscription ID
   * @param userId - User ID (for authorization)
   * @param data - New plan type
   * @returns Updated subscription with proration details
   */
  async changePlan(
    subscriptionId: string,
    userId: string,
    data: ChangePlanRequest
  ): Promise<ChangePlanResponse> {
    const { newPlanType } = data;

    // Get subscription with user verification
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    // Validate subscription is in a changeable state
    if (!['ACTIVE', 'TRIAL'].includes(subscription.status)) {
      throw new ValidationError(`Cannot change plan for subscription with status: ${subscription.status}`);
    }

    // Check if already on the requested plan
    if (subscription.planType === newPlanType) {
      throw new ValidationError(`Already subscribed to ${newPlanType}`);
    }

    // Ensure we have a Stripe subscription ID
    if (!subscription.stripeSubscriptionId) {
      throw new ValidationError('Subscription is not linked to a payment provider');
    }

    // Get the new price ID
    const newPriceId = newPlanType === 'PREMIUM_MONTHLY'
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_ANNUAL;

    if (!newPriceId) {
      throw new InternalError('Stripe price ID not configured for the requested plan');
    }

    try {
      // Retrieve the current Stripe subscription to get the item ID
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      if (!stripeSubscription.items.data.length) {
        throw new InternalError('No subscription items found in Stripe');
      }

      const subscriptionItemId = stripeSubscription.items.data[0].id;
      const currentPriceId = stripeSubscription.items.data[0].price.id;

      // Update the subscription in Stripe WITHOUT proration
      // The plan change takes effect at the end of the current billing period
      const updatedStripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [{
            id: subscriptionItemId,
            price: newPriceId,
          }],
          proration_behavior: 'none', // No immediate charge/credit - change takes effect at period end
        }
      );

      logger.info(`Scheduled plan change for Stripe subscription ${subscription.stripeSubscriptionId} from ${subscription.planType} to ${newPlanType} (effective at period end)`);

      // Get prices for response details
      const [currentPrice, newPrice] = await Promise.all([
        stripe.prices.retrieve(currentPriceId, { expand: ['product'] }),
        stripe.prices.retrieve(newPriceId, { expand: ['product'] }),
      ]);

      // Update local database - note: planType changes but takes effect at period end
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planType: newPlanType as 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL',
          stripePriceId: newPriceId,
          currentPeriodStart: new Date(updatedStripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedStripeSubscription.current_period_end * 1000),
        },
      });

      const currency = (currentPrice.currency || 'usd').toUpperCase();

      // Build response - no proration since change is at period end
      const proration: ProrationPreviewDTO = {
        currentPlan: {
          id: subscription.planType,
          name: this.getPlanName(subscription.planType),
          price: (currentPrice.unit_amount || 0) / 100,
        },
        newPlan: {
          id: newPlanType,
          name: this.getPlanName(newPlanType),
          price: (newPrice.unit_amount || 0) / 100,
        },
        prorationAmount: 0, // No proration - change at period end
        creditAmount: 0, // No credit - current plan runs to completion
        amountDue: 0, // No immediate charge
        currency,
        effectiveDate: new Date(updatedStripeSubscription.current_period_end * 1000).toISOString(), // Change takes effect at period end
        billingCycleAnchor: new Date(updatedStripeSubscription.current_period_end * 1000).toISOString(),
      };

      return {
        subscription: this.mapSubscriptionToDTO(updatedSubscription),
        proration,
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to change subscription plan:', error);
      throw new InternalError(`Failed to change subscription plan: ${error.message}`);
    }
  }

  /**
   * Get proration preview for a potential plan change
   * @param subscriptionId - Subscription ID
   * @param userId - User ID (for authorization)
   * @param newPlanType - Plan type to preview
   * @returns Proration preview details
   */
  async getProrationPreview(
    subscriptionId: string,
    userId: string,
    newPlanType: string
  ): Promise<ProrationPreviewDTO> {
    // Get subscription with user verification
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    // Validate subscription is in a changeable state
    if (!['ACTIVE', 'TRIAL'].includes(subscription.status)) {
      throw new ValidationError(`Cannot preview plan change for subscription with status: ${subscription.status}`);
    }

    // Check if already on the requested plan
    if (subscription.planType === newPlanType) {
      throw new ValidationError(`Already subscribed to ${newPlanType}`);
    }

    // Ensure we have a Stripe subscription ID
    if (!subscription.stripeSubscriptionId) {
      throw new ValidationError('Subscription is not linked to a payment provider');
    }

    // Get the new price ID
    const newPriceId = newPlanType === 'PREMIUM_MONTHLY'
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_ANNUAL;

    if (!newPriceId) {
      throw new InternalError('Stripe price ID not configured for the requested plan');
    }

    try {
      // Retrieve the current Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      if (!stripeSubscription.items.data.length) {
        throw new InternalError('No subscription items found in Stripe');
      }

      const currentPriceId = stripeSubscription.items.data[0].price.id;

      // Get prices for plan details
      const [currentPrice, newPrice] = await Promise.all([
        stripe.prices.retrieve(currentPriceId, { expand: ['product'] }),
        stripe.prices.retrieve(newPriceId, { expand: ['product'] }),
      ]);

      const currency = (currentPrice.currency || 'usd').toUpperCase();

      // No proration - plan change takes effect at period end
      return {
        currentPlan: {
          id: subscription.planType,
          name: this.getPlanName(subscription.planType),
          price: (currentPrice.unit_amount || 0) / 100,
        },
        newPlan: {
          id: newPlanType,
          name: this.getPlanName(newPlanType),
          price: (newPrice.unit_amount || 0) / 100,
        },
        prorationAmount: 0, // No proration
        creditAmount: 0, // No credit - current plan runs to completion
        amountDue: 0, // No immediate charge
        currency,
        effectiveDate: new Date(stripeSubscription.current_period_end * 1000).toISOString(), // Change at period end
        billingCycleAnchor: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to get proration preview:', error);
      throw new InternalError(`Failed to get proration preview: ${error.message}`);
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Get human-readable plan name
   */
  private getPlanName(planType: string): string {
    const names: Record<string, string> = {
      PREMIUM_MONTHLY: 'Premium Monthly',
      PREMIUM_ANNUAL: 'Premium Annual',
    };
    return names[planType] || planType;
  }

  /**
   * Create a Stripe Checkout Session for subscription
   * Uses Stripe's hosted checkout page for payment collection
   */
  private async createStripeSubscription(
    userId: string,
    siteId: string,
    planType: string,
    returnUrl?: string
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

    // Get trial days from settings
    const trialDays = await settings.getTrialDays();

    // Build success and cancel URLs
    // If returnUrl is provided, use it; otherwise default to onboarding flow
    let successUrl: string;
    let cancelUrl: string;

    if (returnUrl) {
      // returnUrl can be a path like "/account/subscriptions" or full URL
      const baseReturnUrl = returnUrl.startsWith('http') ? returnUrl : `${frontendUrl}${returnUrl}`;
      // Preserve siteId in query params
      const separator = baseReturnUrl.includes('?') ? '&' : '?';
      successUrl = `${baseReturnUrl}${separator}siteId=${siteId}&success=true&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${baseReturnUrl}${separator}siteId=${siteId}&canceled=true`;
    } else {
      // Default to onboarding flow for new site creation
      successUrl = `${frontendUrl}/onboarding?step=complete&siteId=${siteId}&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${frontendUrl}/onboarding?step=plan&siteId=${siteId}&canceled=true`;
    }

    // Determine if this is a re-subscription (existing site subscribing again)
    // vs a new subscription from onboarding flow
    const isResubscription = !!returnUrl;

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        siteId,
        planType,
        isResubscription: isResubscription ? 'true' : 'false',
      },
      subscription_data: {
        trial_period_days: trialDays > 0 ? trialDays : undefined,
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
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
