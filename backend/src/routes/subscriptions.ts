/**
 * Subscriptions Routes
 * Route handlers using SubscriptionService for business logic
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { validateJsonContentType } from '../middleware/contentType';
import { subscriptionService } from '../services';
import {
  createSubscriptionSchema,
  subscriptionParamsSchema,
  changePlanSchema,
} from '../schemas';
import { z } from 'zod';

const router = Router();

// ============================================
// Subscription Management
// ============================================

/**
 * @swagger
 * /api/v1/billing/subscriptions:
 *   get:
 *     summary: Get user subscriptions
 *     description: Retrieve user subscriptions, optionally filtered by site
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Filter by specific site ID
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const siteId = req.query.siteId as string | undefined;
    const subscriptions = await subscriptionService.getUserSubscriptions(
      req.user!.id,
      siteId
    );
    res.json(subscriptions.data);
  })
);

/**
 * @swagger
 * /api/v1/billing/subscriptions:
 *   post:
 *     summary: Create subscription
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  validateJsonContentType,
  validateBody(createSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.createSubscription(
      req.user!.id,
      req.body
    );
    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/v1/billing/subscriptions/{subscriptionId}/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/cancel',
  authenticate,
  validateJsonContentType,
  validateParams(subscriptionParamsSchema),
  asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.cancelSubscription(
      req.params.subscriptionId,
      req.user!.id
    );
    res.json(subscription);
  })
);

/**
 * @swagger
 * /api/v1/billing/subscriptions/{subscriptionId}/reactivate:
 *   post:
 *     summary: Reactivate a subscription scheduled for cancellation
 *     description: Removes the pending cancellation from a subscription. Only works if subscription has cancelAtPeriodEnd set to true.
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/reactivate',
  authenticate,
  validateJsonContentType,
  validateParams(subscriptionParamsSchema),
  asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.reactivateSubscription(
      req.params.subscriptionId,
      req.user!.id
    );
    res.json(subscription);
  })
);

/**
 * @swagger
 * /api/v1/billing/subscriptions/{subscriptionId}/portal:
 *   post:
 *     summary: Get customer portal URL
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/portal',
  authenticate,
  validateJsonContentType,
  validateParams(subscriptionParamsSchema),
  asyncHandler(async (req, res) => {
    const portal = await subscriptionService.getCustomerPortalUrl(
      req.params.subscriptionId,
      req.user!.id
    );
    res.json(portal);
  })
);

/**
 * @swagger
 * /api/v1/billing/subscriptions/{subscriptionId}/change-plan:
 *   post:
 *     summary: Change subscription plan (upgrade or downgrade)
 *     description: Changes the subscription to a different plan. Stripe handles proration automatically.
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/change-plan',
  authenticate,
  validateJsonContentType,
  validateParams(subscriptionParamsSchema),
  validateBody(changePlanSchema),
  asyncHandler(async (req, res) => {
    const result = await subscriptionService.changePlan(
      req.params.subscriptionId,
      req.user!.id,
      req.body
    );
    res.json(result);
  })
);

// Query schema for preview-change endpoint
const previewChangeQuerySchema = z.object({
  newPlanType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']),
});

/**
 * @swagger
 * /api/v1/billing/subscriptions/{subscriptionId}/preview-change:
 *   get:
 *     summary: Preview plan change proration
 *     description: Get a preview of charges/credits for changing to a different plan
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:subscriptionId/preview-change',
  authenticate,
  validateParams(subscriptionParamsSchema),
  validateQuery(previewChangeQuerySchema),
  asyncHandler(async (req, res) => {
    const preview = await subscriptionService.getProrationPreview(
      req.params.subscriptionId,
      req.user!.id,
      req.query.newPlanType as string
    );
    res.json(preview);
  })
);

export default router;
