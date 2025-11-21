/**
 * Widget Routes
 * Route handlers for widget configuration using WidgetService
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateParams } from '../middleware/validate';
import { widgetService } from '../services/widget/WidgetService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const siteParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
});

const categoryParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  category: z.string().min(1, 'Category is required'),
});

// ============================================
// Public Widget Endpoints (No Auth)
// ============================================

/**
 * @swagger
 * /api/v1/widget/{siteId}/starters:
 *   get:
 *     summary: Get conversation starters (public)
 *     tags: [Widget]
 */
router.get(
  '/:siteId/starters',
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const starters = await widgetService.getPublicStarters(siteId);
    res.json(starters);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/config:
 *   get:
 *     summary: Get site configuration (public)
 *     tags: [Widget]
 */
router.get(
  '/:siteId/config',
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const config = await widgetService.getPublicConfig(siteId);
    res.json(config);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/validate:
 *   get:
 *     summary: Validate site exists (public)
 *     tags: [Widget]
 */
router.get(
  '/:siteId/validate',
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const origin = req.get('Origin') || req.get('Referer');

    const validation = await widgetService.validateSite(siteId, origin);
    res.json(validation);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/settings:
 *   get:
 *     summary: Get public widget settings
 *     tags: [Widget]
 */
router.get(
  '/:siteId/settings',
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const settings = await widgetService.getPublicSettings(siteId);
    res.json(settings);
  })
);

// ============================================
// Admin Widget Endpoints (Auth Required)
// ============================================

/**
 * @swagger
 * /api/v1/widget/{siteId}/settings/admin:
 *   get:
 *     summary: Get admin widget settings
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId/settings/admin',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const settings = await widgetService.getAdminSettings(siteId, req.user!.id);
    res.json(settings);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/settings/category/{category}:
 *   get:
 *     summary: Get widget settings by category
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId/settings/category/:category',
  authenticate,
  validateParams(categoryParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, category } = req.params;

    const settings = await widgetService.getSettingsByCategory(
      siteId,
      req.user!.id,
      category
    );
    res.json(settings);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/settings:
 *   patch:
 *     summary: Update widget settings (partial)
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:siteId/settings',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const settings = await widgetService.updateSettings(
      siteId,
      req.user!.id,
      req.body
    );

    res.json(settings);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/settings:
 *   put:
 *     summary: Update widget settings (full replace)
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:siteId/settings',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const settings = await widgetService.updateSettings(
      siteId,
      req.user!.id,
      req.body
    );

    res.json(settings);
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/settings/reset:
 *   put:
 *     summary: Reset widget settings to defaults
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:siteId/settings/reset',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const settings = await widgetService.resetSettings(siteId, req.user!.id);
    res.json(settings);
  })
);

export default router;
