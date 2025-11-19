import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Test payment mode - set to true to bypass Stripe and simulate successful payments
const TEST_PAYMENT_MODE = process.env.TEST_PAYMENT_MODE === 'true';

// Only initialize Stripe if not in test mode
const stripe = TEST_PAYMENT_MODE ? null : new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

if (TEST_PAYMENT_MODE) {
  logger.info('⚠️  TEST PAYMENT MODE ENABLED - Stripe payments are bypassed');
}

// Validation schemas
const createSubscriptionSchema = z.object({
  siteId: z.string(),
  planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']),
  paymentMethodId: z.string().optional(),
});

/**
 * @swagger
 * /api/billing/subscriptions:
 *   get:
 *     summary: Get user subscriptions
 *     description: Retrieve all subscriptions for the authenticated user
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   siteId:
 *                     type: string
 *                   planType:
 *                     type: string
 *                     enum: [PREMIUM_MONTHLY, PREMIUM_ANNUAL]
 *                   status:
 *                     type: string
 *                     enum: [TRIAL, ACTIVE, CANCELLED, EXPIRED, PAST_DUE]
 *                   trialEndsAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   currentPeriodStart:
 *                     type: string
 *                     format: date-time
 *                   currentPeriodEnd:
 *                     type: string
 *                     format: date-time
 *                   cancelledAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   site:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       siteName:
 *                         type: string
 *                       siteUrl:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.id },
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

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/subscriptions:
 *   post:
 *     summary: Create subscription
 *     description: Create a new subscription for a site
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *               - planType
 *             properties:
 *               siteId:
 *                 type: string
 *               planType:
 *                 type: string
 *                 enum: [PREMIUM_MONTHLY, PREMIUM_ANNUAL]
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     siteId:
 *                       type: string
 *                     planType:
 *                       type: string
 *                     status:
 *                       type: string
 *                     trialEndsAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     currentPeriodStart:
 *                       type: string
 *                       format: date-time
 *                     currentPeriodEnd:
 *                       type: string
 *                       format: date-time
 *                 clientSecret:
 *                   type: string
 *                   nullable: true
 *                 testMode:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site not found
 *       409:
 *         description: Subscription already exists
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { siteId, planType, paymentMethodId } = createSubscriptionSchema.parse(req.body);

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { siteId },
    });

    if (existingSubscription) {
      throw new AppError(409, 'Subscription already exists for this site');
    }

    // TEST PAYMENT MODE: Bypass Stripe and create subscription directly
    if (TEST_PAYMENT_MODE) {
      logger.info(`[TEST MODE] Creating subscription for site ${siteId} without Stripe`);

      const subscription = await prisma.subscription.create({
        data: {
          userId: req.user!.id,
          siteId,
          planType,
          status: 'ACTIVE', // Directly active in test mode
          trialEndsAt: null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          stripeSubscriptionId: `test_sub_${Date.now()}`,
          stripePriceId: `test_price_${planType.toLowerCase()}`,
        },
      });

      return res.status(201).json({
        subscription,
        clientSecret: null, // No client secret in test mode
        testMode: true,
      });
    }

    // PRODUCTION MODE: Use Stripe
    if (!stripe) {
      throw new AppError(500, 'Stripe is not configured');
    }

    // Get or create Stripe customer
    let customer;
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { billingInfo: true },
    });

    if (user?.billingInfo?.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.billingInfo.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user!.email,
        name: user!.fullName || undefined,
      });

      // Update billing info
      await prisma.billingInfo.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          fullName: user!.fullName || user!.email,
          email: user!.email,
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
    }

    // Determine price ID based on plan type
    const priceId = planType === 'PREMIUM_MONTHLY'
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_ANNUAL;

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
        userId: req.user!.id,
        siteId,
        planType,
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
      },
    });

    res.status(201).json({
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/subscriptions/{subscriptionId}/cancel:
 *   post:
 *     summary: Cancel subscription
 *     description: Cancel an existing subscription
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 siteId:
 *                   type: string
 *                 planType:
 *                   type: string
 *                 status:
 *                   type: string
 *                 cancelledAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Subscription not found
 */
router.post('/:subscriptionId/cancel', authenticate, async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== req.user!.id) {
      throw new AppError(404, 'Subscription not found');
    }

    // Cancel in Stripe (skip if test mode or no Stripe subscription ID)
    if (!TEST_PAYMENT_MODE && stripe && subscription.stripeSubscriptionId && !subscription.stripeSubscriptionId.startsWith('test_')) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update subscription status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    res.json(updatedSubscription);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/plans:
 *   get:
 *     summary: Get available plans
 *     description: Get list of available subscription plans
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: List of available plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   interval:
 *                     type: string
 *                     enum: [month, year]
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/plans', async (req, res) => {
  const plans = [
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

  res.json(plans);
});

/**
 * @swagger
 * /api/billing/subscriptions/{subscriptionId}/portal:
 *   post:
 *     summary: Get customer portal URL
 *     description: Generate a Stripe customer portal session URL
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Portal URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Subscription not found
 */
router.post('/:subscriptionId/portal', authenticate, async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== req.user!.id) {
      throw new AppError(404, 'Subscription not found');
    }

    // In test mode, return a mock portal URL
    if (TEST_PAYMENT_MODE) {
      return res.json({
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/subscriptions?testPortal=true`,
      });
    }

    if (!stripe) {
      throw new AppError(500, 'Stripe is not configured');
    }

    // Get user's billing info for Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { billingInfo: true },
    });

    if (!user?.billingInfo?.stripeCustomerId) {
      throw new AppError(400, 'No billing information found');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.billingInfo.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/subscriptions`,
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

export default router;