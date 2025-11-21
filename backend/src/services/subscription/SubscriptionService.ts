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

// Test payment mode configuration
const TEST_PAYMENT_MODE = process.env.TEST_PAYMENT_MODE === 'true';

// Initialize Stripe only if not in test mode
const stripe = TEST_PAYMENT_MODE ? null : new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

if (TEST_PAYMENT_MODE) {
  logger.info('⚠️  TEST PAYMENT MODE ENABLED - Stripe payments are bypassed');
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

    // TEST PAYMENT MODE: Bypass Stripe and create subscription directly
    if (TEST_PAYMENT_MODE) {
      return this.createTestSubscription(userId, siteId, planType);
    }

    // PRODUCTION MODE: Use Stripe
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

    // Cancel in Stripe (skip if test mode or no Stripe subscription ID)
    if (
      !TEST_PAYMENT_MODE &&
      stripe &&
      subscription.stripeSubscriptionId &&
      !subscription.stripeSubscriptionId.startsWith('test_')
    ) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
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
   * Get available subscription plans
   * @returns List of available plans
   */
  getAvailablePlans(): SubscriptionPlanDTO[] {
    return [
      {
        id: 'PREMIUM_MONTHLY',
        name: 'Premium Monthly',
        description: 'Full access to all features, billed monthly',
        price: 29,
        interval: 'month',
        features: [
          'Unlimited conversations',
          'Advanced analytics',
          'Custom branding',
          'Priority support',
          'API access',
        ],
      },
      {
        id: 'PREMIUM_ANNUAL',
        name: 'Premium Annual',
        description: 'Full access to all features, billed annually (save 20%)',
        price: 279,
        interval: 'year',
        features: [
          'Unlimited conversations',
          'Advanced analytics',
          'Custom branding',
          'Priority support',
          'API access',
          '2 months free',
        ],
      },
    ];
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

    // In test mode, return a mock portal URL
    if (TEST_PAYMENT_MODE) {
      return {
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/subscriptions?testPortal=true`,
      };
    }

    if (!stripe) {
      throw new InternalError('Stripe is not configured');
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
   * Create a test subscription (bypassing Stripe)
   */
  private async createTestSubscription(
    userId: string,
    siteId: string,
    planType: string
  ): Promise<CreateSubscriptionResponse> {
    logger.info(`[TEST MODE] Creating subscription for site ${siteId} without Stripe`);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        siteId,
        planType: planType as any,
        status: 'ACTIVE', // Directly active in test mode
        trialEndsAt: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        stripeSubscriptionId: `test_sub_${Date.now()}`,
        stripePriceId: `test_price_${planType.toLowerCase()}`,
      },
    });

    return {
      subscription: this.mapSubscriptionToDTO(subscription),
      clientSecret: null,
      testMode: true,
    };
  }

  /**
   * Create a Stripe subscription
   */
  private async createStripeSubscription(
    userId: string,
    siteId: string,
    planType: string
  ): Promise<CreateSubscriptionResponse> {
    if (!stripe) {
      throw new InternalError('Stripe is not configured');
    }

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

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      trial_period_days: 14,
      expand: ['latest_invoice.payment_intent'],
    });

    // Create subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        siteId,
        planType: planType as any,
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
      },
    });

    return {
      subscription: this.mapSubscriptionToDTO(subscription),
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    if (!stripe) {
      throw new InternalError('Stripe is not configured');
    }

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
