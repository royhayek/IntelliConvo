/**
 * Admin Subscriptions Routes
 * Route handlers for admin subscription management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminSubscriptionService } from '../../services/admin';
import { SubscriptionStatus, PlanType } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/subscriptions:
 *   get:
 *     summary: Get paginated list of subscriptions
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      status,
      planType,
      userId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminSubscriptionService.getSubscriptions({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      status: status as SubscriptionStatus | undefined,
      planType: planType as PlanType | undefined,
      userId: userId as string | undefined,
      search: search as string | undefined,
      sortBy: sortBy as 'createdAt' | 'currentPeriodEnd' | 'status',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/stats:
 *   get:
 *     summary: Get subscription statistics
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await adminSubscriptionService.getSubscriptionStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/export:
 *   get:
 *     summary: Export subscriptions
 *     description: Export subscriptions as CSV or JSON
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { format = 'json', status, planType, userId, search } = req.query;

    const result = await adminSubscriptionService.exportSubscriptions(
      format as 'csv' | 'json',
      {
        status: status as SubscriptionStatus | undefined,
        planType: planType as PlanType | undefined,
        userId: userId as string | undefined,
        search: search as string | undefined,
      }
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.json({ data: result });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/{subscriptionId}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:subscriptionId',
  asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const subscription = await adminSubscriptionService.getSubscriptionById(subscriptionId);
    res.json({ data: subscription });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/{subscriptionId}:
 *   patch:
 *     summary: Update subscription
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:subscriptionId',
  asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const { status, planType, currentPeriodEnd, trialEndsAt } = req.body;

    const subscription = await adminSubscriptionService.updateSubscription(subscriptionId, {
      status,
      planType,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
      trialEndsAt: trialEndsAt === null ? null : trialEndsAt ? new Date(trialEndsAt) : undefined,
    });

    res.json({ data: subscription });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/{subscriptionId}/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/cancel',
  asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const result = await adminSubscriptionService.cancelSubscription(subscriptionId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/{subscriptionId}/reactivate:
 *   post:
 *     summary: Reactivate cancelled subscription
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/reactivate',
  asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const result = await adminSubscriptionService.reactivateSubscription(subscriptionId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/{subscriptionId}/extend-trial:
 *   post:
 *     summary: Extend trial period
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:subscriptionId/extend-trial',
  asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const { days } = req.body;

    if (!days || typeof days !== 'number' || days < 1) {
      return res.status(400).json({ error: 'Days must be a positive number' });
    }

    const result = await adminSubscriptionService.extendTrial(subscriptionId, days);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/subscriptions/{subscriptionId}:
 *   delete:
 *     summary: Delete subscription
 *     tags: [Admin - Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:subscriptionId',
  asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const result = await adminSubscriptionService.deleteSubscription(subscriptionId);
    res.json(result);
  })
);

export default router;
