import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { queueEmbeddingGeneration } from '../queues';
import { siteService } from '../services/site/SiteService';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
}));

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info(`Checkout session completed: ${session.id}`);

  // Only handle subscription checkouts
  if (session.mode !== 'subscription') {
    logger.info(`Skipping non-subscription checkout: ${session.mode}`);
    return;
  }

  const { userId, siteId, planType } = session.metadata || {};

  if (!userId || !siteId || !planType) {
    logger.error('Missing metadata in checkout session:', { userId, siteId, planType });
    return;
  }

  // Check if subscription already exists (avoid duplicates)
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      siteId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
  });

  let subscriptionId: string;

  if (existingSubscription) {
    logger.info(`Subscription already exists for site ${siteId}, updating...`);
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: session.subscription as string,
        status: 'ACTIVE',
      },
    });
    subscriptionId = existingSubscription.id;
  } else {
    // Create new subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        siteId,
        planType: planType as 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL',
        status: 'ACTIVE',
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: planType === 'PREMIUM_MONTHLY'
          ? process.env.STRIPE_PRICE_MONTHLY
          : process.env.STRIPE_PRICE_ANNUAL,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (planType === 'PREMIUM_ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000),
      },
    });
    subscriptionId = subscription.id;
    logger.info(`Created subscription ${subscription.id} for site ${siteId}`);
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

  // Queue embedding generation now that payment is complete
  try {
    await queueEmbeddingGeneration(siteId, userId);
    logger.info(`Queued embedding generation for site ${siteId} after successful payment`);
  } catch (error) {
    logger.error(`Failed to queue embedding generation for site ${siteId}:`, error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.info(`Subscription created: ${subscription.id}`);

  // Build update data with valid dates only
  const updateData: any = {
    status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
  };

  // Only set dates if they are valid timestamps
  if (subscription.current_period_start && subscription.current_period_start > 0) {
    updateData.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  }
  if (subscription.current_period_end && subscription.current_period_end > 0) {
    updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  }

  // Find subscription in our database and update status
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info(`Subscription updated: ${subscription.id}`);

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
  };

  // Only set dates if they are valid timestamps
  if (subscription.current_period_start && subscription.current_period_start > 0) {
    updateData.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  }
  if (subscription.current_period_end && subscription.current_period_end > 0) {
    updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  }

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info(`Subscription deleted: ${subscription.id}`);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });
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
    }
  }
}

export default router;