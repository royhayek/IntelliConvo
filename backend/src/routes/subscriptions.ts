/**
 * Subscriptions Routes
 * Route handlers using SubscriptionService for business logic
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams } from '../middleware/validate';
import { validateJsonContentType } from '../middleware/contentType';
import { subscriptionService } from '../services';
import {
  createSubscriptionSchema,
  subscriptionParamsSchema,
} from '../schemas';

const router = Router();

// ============================================
// Subscription Management
// ============================================

/**
 * @swagger
 * /api/v1/billing/subscriptions:
 *   get:
 *     summary: Get user subscriptions
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const subscriptions = await subscriptionService.getUserSubscriptions(
      req.user!.id
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

// ============================================
// Subscription Plans
// ============================================

/**
 * @swagger
 * /api/v1/billing/plans:
 *   get:
 *     summary: Get available plans
 *     tags: [Billing]
 */
router.get(
  '/plans',
  asyncHandler(async (req, res) => {
    const plans = subscriptionService.getAvailablePlans();
    res.json(plans);
  })
);

export default router;
