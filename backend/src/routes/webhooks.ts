import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { queueEmbeddingGeneration, queueSubscriptionEmail, queuePaymentFailedEmail, queueTrialExpiringEmail, queueRefundConfirmationEmail, queueDisputeAlertEmail, queueSubscriptionCancelledEmail, queueDelayedNotification } from '../queues';
import { siteService } from '../services/site/SiteService';
import { cacheService, CacheNamespace, CacheTTL } from '../services/cache';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Check if a webhook event has already been processed (idempotency)
 * Prevents duplicate processing when Stripe retries events
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const cached = await cacheService.get<boolean>(CacheNamespace.STRIPE_EVENTS, eventId);
  return cached === true;
}

/**
 * Mark a webhook event as processed
 * Events are cached for 24 hours to prevent reprocessing
 */
async function markEventProcessed(eventId: string): Promise<void> {
  await cacheService.set(CacheNamespace.STRIPE_EVENTS, eventId, true, 86400); // 24 hours
}

// Use express.raw() to get the raw body for Stripe signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Missing signature or webhook secret');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Idempotency check - skip if already processed
    if (await isEventProcessed(event.id)) {
      logger.info(`Skipping already processed event: ${event.id}`);
      return res.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed for idempotency
    await markEventProcessed(event.id);

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error);
    // Return 200 to prevent Stripe from retrying - log the error for investigation
    // Only return 500 for transient errors that Stripe should retry
    res.json({ received: true, error: 'Processing error logged' });
  }
}));

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info(`Checkout session completed: ${session.id}`);

  // Only handle subscription checkouts
  if (session.mode !== 'subscription') {
    logger.info(`Skipping non-subscription checkout: ${session.mode}`);
    return;
  }

  const { userId, siteId, planType, isResubscription } = session.metadata || {};

  if (!userId || !siteId || !planType) {
    logger.error('Missing metadata in checkout session:', { userId, siteId, planType });
    return;
  }

  // Check if this is a re-subscription for an existing site (vs new onboarding)
  const isExistingSiteResubscription = isResubscription === 'true';

  // Check if subscription already exists for this site (any status)
  const existingSubscription = await prisma.subscription.findUnique({
    where: { siteId },
  });

  let subscriptionId: string;

  if (existingSubscription && ['ACTIVE', 'TRIAL'].includes(existingSubscription.status)) {
    // Active/trial subscription exists - just update it
    logger.info(`Active subscription already exists for site ${siteId}, updating...`);
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: session.subscription as string,
        status: 'ACTIVE',
      },
    });
    subscriptionId = existingSubscription.id;
  } else if (existingSubscription && ['CANCELLED', 'EXPIRED'].includes(existingSubscription.status)) {
    // Cancelled/expired subscription exists - delete it to make room for new one
    logger.info(`Replacing ${existingSubscription.status} subscription for site ${siteId} with new subscription`);
    await prisma.subscription.delete({
      where: { id: existingSubscription.id },
    });
    // Fetch subscription from Stripe to get accurate status (trial vs active)
    let subscriptionStatus: 'TRIAL' | 'ACTIVE' = 'ACTIVE';
    let trialEndsAt: Date | null = null;
    let currentPeriodStart = new Date();
    let currentPeriodEnd = new Date(Date.now() + (planType === 'PREMIUM_ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000);

    if (session.subscription) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
        if (stripeSubscription.status === 'trialing') {
          subscriptionStatus = 'TRIAL';
          if (stripeSubscription.trial_end) {
            trialEndsAt = new Date(stripeSubscription.trial_end * 1000);
          }
        }
        if (stripeSubscription.current_period_start) {
          currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        }
        if (stripeSubscription.current_period_end) {
          currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        }
      } catch (error) {
        logger.warn('Failed to fetch subscription from Stripe for status check:', error);
      }
    }

    // Create new subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        siteId,
        planType: planType as 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL',
        status: subscriptionStatus,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: planType === 'PREMIUM_MONTHLY'
          ? process.env.STRIPE_PRICE_MONTHLY
          : process.env.STRIPE_PRICE_ANNUAL,
        currentPeriodStart,
        currentPeriodEnd,
        trialEndsAt,
      },
    });
    subscriptionId = subscription.id;
    logger.info(`Created subscription ${subscription.id} for site ${siteId} with status ${subscriptionStatus}`);
  } else {
    // No existing subscription - create a new one
    // Fetch subscription from Stripe to get accurate status (trial vs active)
    let subscriptionStatus: 'TRIAL' | 'ACTIVE' = 'ACTIVE';
    let trialEndsAt: Date | null = null;
    let currentPeriodStart = new Date();
    let currentPeriodEnd = new Date(Date.now() + (planType === 'PREMIUM_ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000);

    if (session.subscription) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
        if (stripeSubscription.status === 'trialing') {
          subscriptionStatus = 'TRIAL';
          if (stripeSubscription.trial_end) {
            trialEndsAt = new Date(stripeSubscription.trial_end * 1000);
          }
        }
        if (stripeSubscription.current_period_start) {
          currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        }
        if (stripeSubscription.current_period_end) {
          currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        }
      } catch (error) {
        logger.warn('Failed to fetch subscription from Stripe for status check:', error);
      }
    }

    // Create new subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        siteId,
        planType: planType as 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL',
        status: subscriptionStatus,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: planType === 'PREMIUM_MONTHLY'
          ? process.env.STRIPE_PRICE_MONTHLY
          : process.env.STRIPE_PRICE_ANNUAL,
        currentPeriodStart,
        currentPeriodEnd,
        trialEndsAt,
      },
    });
    subscriptionId = subscription.id;
    logger.info(`Created subscription ${subscription.id} for site ${siteId} with status ${subscriptionStatus}`);
  }

  // Create initial billing transaction for the checkout payment
  // This ensures we have a transaction record even if invoice.payment_succeeded fires before subscription exists
  if (session.amount_total && session.amount_total > 0) {
    // Check if transaction already exists (avoid duplicates)
    const existingTransaction = await prisma.billingTransaction.findFirst({
      where: {
        OR: [
          { stripeInvoiceId: session.invoice as string },
          { invoiceId: session.id }, // Fallback to session ID
        ],
      },
    });

    if (!existingTransaction) {
      await prisma.billingTransaction.create({
        data: {
          userId,
          siteId,
          invoiceId: (session.invoice as string) || session.id,
          amount: session.amount_total / 100, // Convert from cents
          currency: (session.currency || 'usd').toUpperCase(),
          status: 'paid',
          stripeInvoiceId: session.invoice as string || null,
        },
      });
      logger.info(`Created initial billing transaction for checkout session ${session.id}`);
    }
  }

  // Invalidate site cache so fresh subscription data is served
  await siteService.invalidateSiteCacheById(siteId);

  // Only queue embedding generation for new subscriptions (onboarding flow)
  // Skip for re-subscriptions where the site already has crawled URLs and embeddings
  if (!isExistingSiteResubscription) {
    try {
      await queueEmbeddingGeneration(siteId, userId);
      logger.info(`Queued embedding generation for site ${siteId} after successful payment`);
    } catch (error) {
      logger.error(`Failed to queue embedding generation for site ${siteId}:`, error);
    }
  } else {
    logger.info(`Skipping embedding generation for re-subscription on site ${siteId} - URLs already processed`);
  }

  // Send subscription confirmation email
  // Send for both new subscriptions and re-subscriptions (user should know their subscription is active)
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const site = await prisma.site.findUnique({ where: { id: siteId } });

    if (user && site) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const planName = planType === 'PREMIUM_ANNUAL' ? 'Premium Annual' : 'Premium Monthly';
      const billingPeriod = planType === 'PREMIUM_ANNUAL' ? 'year' : 'month';

      // Get the actual subscription price from Stripe if session amount is 0 (trial/coupon)
      let amount = '$0.00';
      if (session.amount_total && session.amount_total > 0) {
        amount = `$${(session.amount_total / 100).toFixed(2)}`;
      } else if (session.subscription) {
        // Fetch the subscription to get the actual price
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceAmount = stripeSubscription.items.data[0]?.price?.unit_amount;
          if (priceAmount && priceAmount > 0) {
            amount = `$${(priceAmount / 100).toFixed(2)}`;
          }
        } catch (stripeError) {
          logger.warn('Failed to fetch subscription price from Stripe:', stripeError);
        }
      }

      const nextBillingDate = new Date(
        Date.now() + (planType === 'PREMIUM_ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      await queueSubscriptionEmail(userId, user.email, {
        userName: user.fullName || '',
        email: user.email,
        planName,
        siteName: site.siteName,
        amount,
        billingPeriod,
        nextBillingDate,
        dashboardUrl: `${frontendUrl}/sites/${siteId}`,
        manageSubscriptionUrl: `${frontendUrl}/account/billing?siteId=${siteId}`,
      });
      logger.info(`Queued subscription confirmation email for user ${userId}`);
    }
  } catch (error) {
    logger.error('Failed to queue subscription confirmation email:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.info(`Subscription created: ${subscription.id}`);

  // Build update data with valid dates only
  const updateData: any = {
    status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  };

  // Only set dates if they are valid timestamps
  if (subscription.current_period_start && subscription.current_period_start > 0) {
    updateData.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  }
  if (subscription.current_period_end && subscription.current_period_end > 0) {
    updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  }

  // Set trial end date if subscription is trialing
  if (subscription.trial_end && subscription.trial_end > 0) {
    updateData.trialEndsAt = new Date(subscription.trial_end * 1000);
  }

  // Find subscription in our database and update status
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info(`Subscription updated: ${subscription.id}, status: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`);

  let status: 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' = 'ACTIVE';

  if (subscription.status === 'trialing') {
    status = 'TRIAL';
  } else if (subscription.status === 'canceled') {
    status = 'CANCELLED';
  } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    status = 'EXPIRED';
  }

  // Build update data with valid dates only
  const updateData: any = {
    status,
    cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    // Track if subscription is scheduled to cancel at period end
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  };

  // Only set dates if they are valid timestamps
  if (subscription.current_period_start && subscription.current_period_start > 0) {
    updateData.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  }
  if (subscription.current_period_end && subscription.current_period_end > 0) {
    updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  }

  // Update trial end date (will be null if trial ended or no trial)
  if (subscription.trial_end && subscription.trial_end > 0) {
    updateData.trialEndsAt = new Date(subscription.trial_end * 1000);
  } else if (status !== 'TRIAL') {
    // Clear trial end date when no longer trialing
    updateData.trialEndsAt = null;
  }

  // Detect plan changes by checking the current price
  if (subscription.items?.data?.length > 0) {
    const currentPriceId = subscription.items.data[0].price.id;

    // Determine plan type from current price ID
    let newPlanType: 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL' | null = null;
    if (currentPriceId === process.env.STRIPE_PRICE_MONTHLY) {
      newPlanType = 'PREMIUM_MONTHLY';
    } else if (currentPriceId === process.env.STRIPE_PRICE_ANNUAL) {
      newPlanType = 'PREMIUM_ANNUAL';
    }

    if (newPlanType) {
      // Check if plan actually changed
      const existingSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (existingSubscription && existingSubscription.planType !== newPlanType) {
        logger.info(`Plan change detected: ${existingSubscription.planType} -> ${newPlanType} for subscription ${subscription.id}`);
        updateData.planType = newPlanType;
        updateData.stripePriceId = currentPriceId;
      }
    }
  }

  const result = await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  });

  logger.info(`Updated ${result.count} subscription(s) for stripeSubscriptionId: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info(`Subscription deleted: ${subscription.id}`);

  // Find the subscription before updating to get user/site info for email
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true, site: true },
  });

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  // Send subscription cancelled email
  if (dbSubscription) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const planName = dbSubscription.planType === 'PREMIUM_ANNUAL' ? 'Premium Annual' : 'Premium Monthly';

      // Access ends at current period end
      const accessEndsAt = dbSubscription.currentPeriodEnd.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await queueSubscriptionCancelledEmail(dbSubscription.userId, dbSubscription.user.email, {
        userName: dbSubscription.user.fullName || '',
        email: dbSubscription.user.email,
        siteName: dbSubscription.site.siteName,
        planName,
        accessEndsAt,
        resubscribeUrl: `${frontendUrl}/sites/${dbSubscription.siteId}`,
      });
      logger.info(`Queued subscription cancelled email for user ${dbSubscription.userId}`);

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: dbSubscription.userId,
          type: NotificationType.WARNING,
          title: 'Subscription Cancelled',
          message: `Your ${planName} subscription for ${dbSubscription.site.siteName} has been cancelled. Access ends on ${accessEndsAt}.`,
          siteId: dbSubscription.siteId,
          link: `/sites/${dbSubscription.siteId}`,
        },
      });
    } catch (error) {
      logger.error('Failed to queue subscription cancelled email:', error);
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info(`Invoice payment succeeded: ${invoice.id}`);

  // Create billing transaction record
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (subscription) {
      // Check if transaction already exists (avoid duplicates from checkout.session.completed)
      const existingTransaction = await prisma.billingTransaction.findFirst({
        where: { stripeInvoiceId: invoice.id },
      });

      if (!existingTransaction) {
        await prisma.billingTransaction.create({
          data: {
            userId: subscription.userId,
            siteId: subscription.siteId,
            invoiceId: invoice.number || invoice.id,
            amount: (invoice.amount_paid || 0) / 100, // Convert from cents
            currency: invoice.currency.toUpperCase(),
            status: 'paid',
            stripeInvoiceId: invoice.id,
          },
        });
        logger.info(`Created billing transaction for invoice ${invoice.id}`);
      } else {
        logger.info(`Transaction already exists for invoice ${invoice.id}, skipping`);
      }

      // Update subscription status if it was a trial
      if (subscription.status === 'TRIAL') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        });
      }
    } else {
      logger.warn(`No subscription found for stripeSubscriptionId: ${invoice.subscription}`);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.info(`Invoice payment failed: ${invoice.id}`);

  // Create billing transaction record
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { user: true, site: true },
    });

    if (subscription) {
      await prisma.billingTransaction.create({
        data: {
          userId: subscription.userId,
          siteId: subscription.siteId,
          invoiceId: invoice.number || invoice.id,
          amount: (invoice.amount_due || 0) / 100,
          currency: invoice.currency.toUpperCase(),
          status: 'failed',
          stripeInvoiceId: invoice.id,
        },
      });

      // Mark subscription as expired after payment failure
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });

      // Send payment failed email
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const amount = invoice.amount_due ? `$${(invoice.amount_due / 100).toFixed(2)}` : '$0.00';

        // Get failure reason from the invoice's last payment error
        let failureReason: string | undefined;
        if (invoice.last_finalization_error?.message) {
          failureReason = invoice.last_finalization_error.message;
        }

        // Calculate retry date (Stripe typically retries after 3 days)
        const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        await queuePaymentFailedEmail(subscription.userId, subscription.user.email, {
          userName: subscription.user.fullName || '',
          email: subscription.user.email,
          siteName: subscription.site.siteName,
          amount,
          failureReason,
          updatePaymentUrl: `${frontendUrl}/account/billing`,
          retryDate,
        });
        logger.info(`Queued payment failed email for user ${subscription.userId}`);
      } catch (error) {
        logger.error('Failed to queue payment failed email:', error);
      }
    }
  }
}

/**
 * Handle trial ending soon notification
 * Stripe sends this 3 days before trial ends
 *
 * Smart delay: For short trials (1-2 days), we delay notifications by 3 hours
 * to avoid sending "trial ends tomorrow" immediately after signup
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  logger.info(`Trial will end soon for subscription: ${subscription.id}`);

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true, site: true },
  });

  if (dbSubscription) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // Smart delay: For short trials (1-2 days), delay notification by 3 hours
    // This prevents sending "trial ends tomorrow" immediately after signup
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const delayMs = daysRemaining <= 2 ? THREE_HOURS_MS : undefined;

    if (delayMs) {
      logger.info(`Short trial detected (${daysRemaining} days). Delaying notifications by 3 hours for site ${dbSubscription.site.siteName}`);
    }

    try {
      const expiresAtFormatted = trialEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Queue email with optional delay
      await queueTrialExpiringEmail(dbSubscription.userId, dbSubscription.user.email, {
        userName: dbSubscription.user.fullName || '',
        email: dbSubscription.user.email,
        siteName: dbSubscription.site.siteName,
        planName: dbSubscription.planType === 'PREMIUM_ANNUAL' ? 'Premium Annual' : 'Premium Monthly',
        daysRemaining,
        expiresAt: expiresAtFormatted,
        upgradeUrl: `${frontendUrl}/account/subscriptions?siteId=${dbSubscription.siteId}`,
      }, delayMs);

      // Queue in-app notification with the same delay
      await queueDelayedNotification({
        userId: dbSubscription.userId,
        type: NotificationType.WARNING,
        title: 'Trial Ending Soon',
        message: `Your trial for ${dbSubscription.site.siteName} ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${expiresAtFormatted}). Add a payment method to continue using your assistant.`,
        siteId: dbSubscription.siteId,
        link: `/account/subscriptions?siteId=${dbSubscription.siteId}`,
      }, delayMs);

      logger.info(`Queued trial expiring notifications for user ${dbSubscription.userId}, site ${dbSubscription.site.siteName}${delayMs ? ' (delayed 3 hours)' : ''}`);
    } catch (error) {
      logger.error('Failed to queue trial expiring notifications:', error);
    }
  }
}

/**
 * Handle refund events
 * Updates transaction status when a charge is refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info(`Charge refunded: ${charge.id}, amount: ${charge.amount_refunded}`);

  // Find the transaction by the invoice ID (if available)
  if (charge.invoice) {
    const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;

    const transaction = await prisma.billingTransaction.findFirst({
      where: { stripeInvoiceId: invoiceId },
    });

    if (transaction) {
      // Update transaction status to reflect refund
      await prisma.billingTransaction.update({
        where: { id: transaction.id },
        data: {
          status: charge.refunded ? 'refunded' : 'partially_refunded',
        },
      });
      logger.info(`Updated transaction ${transaction.id} status to refunded`);

      // Send refund confirmation email
      try {
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { email: true, fullName: true },
        });

        const site = await prisma.site.findUnique({
          where: { id: transaction.siteId },
          select: { siteName: true },
        });

        if (user && site) {
          const refundAmount = charge.amount_refunded / 100;
          const currency = charge.currency.toUpperCase();

          await queueRefundConfirmationEmail(transaction.userId, user.email, {
            userName: user.fullName || '',
            email: user.email,
            siteName: site.siteName,
            amount: `$${refundAmount.toFixed(2)} ${currency}`,
            refundDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            transactionId: transaction.id,
          });
          logger.info(`Queued refund confirmation email for user ${transaction.userId}`);
        }
      } catch (error) {
        logger.error('Failed to queue refund confirmation email:', error);
      }
    }
  }
}

/**
 * Handle dispute/chargeback events
 * Critical for fraud prevention and customer support
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  logger.error(`DISPUTE CREATED: ${dispute.id}, charge: ${dispute.charge}, amount: ${dispute.amount}, reason: ${dispute.reason}`);

  // Find the related charge and transaction
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  if (chargeId) {
    try {
      const charge = await stripe.charges.retrieve(chargeId);

      if (charge.invoice) {
        const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;

        const transaction = await prisma.billingTransaction.findFirst({
          where: { stripeInvoiceId: invoiceId },
        });

        if (transaction) {
          // Get user and site info
          const user = await prisma.user.findUnique({
            where: { id: transaction.userId },
            select: { email: true, fullName: true },
          });

          const site = await prisma.site.findUnique({
            where: { id: transaction.siteId },
            select: { siteName: true },
          });

          // Update transaction status
          await prisma.billingTransaction.update({
            where: { id: transaction.id },
            data: { status: 'disputed' },
          });

          // Log critical alert - disputes require immediate attention
          logger.error(`CRITICAL: Dispute for user ${transaction.userId}, site ${site?.siteName}, amount: $${dispute.amount / 100}`);

          // Send dispute alert to all admin users
          try {
            const adminUsers = await prisma.user.findMany({
              where: { isAdmin: true },
              select: { email: true },
            });

            const stripeDisputeUrl = `https://dashboard.stripe.com/disputes/${dispute.id}`;
            const disputeReason = dispute.reason || 'unspecified';
            const respondByDate = dispute.evidence_details?.due_by
              ? new Date(dispute.evidence_details.due_by * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : undefined;

            for (const admin of adminUsers) {
              await queueDisputeAlertEmail(admin.email, {
                disputeId: dispute.id,
                chargeId: chargeId,
                amount: `${(dispute.amount / 100).toFixed(2)}`,
                currency: dispute.currency.toUpperCase(),
                reason: disputeReason,
                customerEmail: user?.email || 'unknown',
                customerName: user?.fullName || undefined,
                siteName: site?.siteName || 'Unknown Site',
                siteId: transaction.siteId,
                userId: transaction.userId,
                createdAt: new Date(dispute.created * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                respondByDate,
                stripeDisputeUrl,
              });
            }
            logger.info(`Sent dispute alert to ${adminUsers.length} admin(s)`);
          } catch (emailError) {
            logger.error('Failed to send dispute alert emails:', emailError);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing dispute:', error);
    }
  }
}

export default router;