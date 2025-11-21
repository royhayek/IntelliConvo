import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * @swagger
 * /api/v1/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook handler
 *     description: Handle Stripe webhook events for subscription and payment updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid webhook signature or missing secret
 *       500:
 *         description: Webhook processing failed
 */
router.post('/stripe', asyncHandler(async (req, res) => {
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

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.info(`Subscription created: ${subscription.id}`);

  // Find subscription in our database and update status
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
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

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
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

      // Update subscription status if it was a trial
      if (subscription.status === 'TRIAL') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        });
      }
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