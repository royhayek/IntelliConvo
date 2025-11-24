/**
 * Admin Settings Routes
 * Route handlers for system settings management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminSettingsService } from '../../services/admin';
import { SettingCategory } from '@prisma/client';

const router = Router();

// ============================================
// Settings Management Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/settings:
 *   get:
 *     summary: Get all system settings
 *     description: Returns all system settings, optionally filtered by category
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [GENERAL, AI, SECURITY, RATE_LIMIT, EMAIL, BILLING, STORAGE]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category } = req.query;

    const result = await adminSettingsService.getSettings(
      category as SettingCategory | undefined
    );

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/settings/by-category:
 *   get:
 *     summary: Get all settings grouped by category
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/by-category',
  asyncHandler(async (req, res) => {
    const result = await adminSettingsService.getSettingsByCategory();
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/settings/bulk:
 *   patch:
 *     summary: Bulk update multiple settings
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/bulk',
  asyncHandler(async (req, res) => {
    const { settings } = req.body;
    const adminId = req.user?.id || 'unknown';

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings array is required' });
    }

    const result = await adminSettingsService.bulkUpdateSettings(settings, adminId);
    res.json({ data: result });
  })
);

// ============================================
// Cache Management Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/settings/cache/clear:
 *   post:
 *     summary: Clear all system caches
 *     description: Clears all caches except user sessions. Safe to run anytime - caches will repopulate on next request.
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caches cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     cleared:
 *                       type: array
 *                       items:
 *                         type: string
 *                     message:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/cache/clear',
  asyncHandler(async (req, res) => {
    const result = await adminSettingsService.clearAllCaches();
    res.json({
      data: {
        ...result,
        message: 'All caches cleared successfully',
      },
    });
  })
);

// ============================================
// Single Setting Routes (must be last due to :key param)
// ============================================

/**
 * @swagger
 * /api/v1/admin/settings/{key}:
 *   get:
 *     summary: Get a specific setting by key
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const setting = await adminSettingsService.getSettingByKey(key);
    res.json({ data: setting });
  })
);

/**
 * @swagger
 * /api/v1/admin/settings/{key}:
 *   patch:
 *     summary: Update a specific setting
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:key',
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const adminId = req.user?.id || 'unknown';

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const setting = await adminSettingsService.updateSetting(key, value, adminId);
    res.json({ data: setting });
  })
);

export default router;
