/**
 * Admin Stats Routes
 * Route handlers for admin dashboard statistics
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

import { adminStatsService } from '../../services/admin';

const router = Router();

// ============================================
// Dashboard Statistics
// ============================================

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     summary: Get all dashboard statistics
 *     description: Returns comprehensive statistics for the admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getDashboardStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/users:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getUserStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/sites:
 *   get:
 *     summary: Get site statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/sites',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getSiteStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/embeddings:
 *   get:
 *     summary: Get embedding statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/embeddings',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getEmbeddingStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/files:
 *   get:
 *     summary: Get file statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/files',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getFileStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/conversations:
 *   get:
 *     summary: Get conversation statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/conversations',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getConversationStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/subscriptions:
 *   get:
 *     summary: Get subscription statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/subscriptions',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getSubscriptionStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/security:
 *   get:
 *     summary: Get security statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/security',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getSecurityStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/stats/billing:
 *   get:
 *     summary: Get billing statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/billing',
  asyncHandler(async (_req, res) => {
    const stats = await adminStatsService.getBillingStats();
    res.json({ data: stats });
  })
);

export default router;
