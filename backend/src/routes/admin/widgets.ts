/**
 * Admin Widgets Routes
 * Route handlers for admin widget settings management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminWidgetService } from '../../services/admin';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/widgets:
 *   get:
 *     summary: Get paginated list of widget settings
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      search,
      theme,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminWidgetService.getWidgets({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      theme: theme as string | undefined,
      sortBy: sortBy as 'createdAt' | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/stats:
 *   get:
 *     summary: Get widget statistics
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await adminWidgetService.getWidgetStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/site/{siteId}:
 *   get:
 *     summary: Get widget settings by site ID
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/site/:siteId',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const widget = await adminWidgetService.getWidgetBySiteId(siteId);
    res.json({ data: widget });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/{widgetId}:
 *   get:
 *     summary: Get widget settings by ID
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:widgetId',
  asyncHandler(async (req, res) => {
    const { widgetId } = req.params;
    const widget = await adminWidgetService.getWidgetById(widgetId);
    res.json({ data: widget });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/{widgetId}:
 *   patch:
 *     summary: Update widget settings
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:widgetId',
  asyncHandler(async (req, res) => {
    const { widgetId } = req.params;
    const widget = await adminWidgetService.updateWidget(widgetId, req.body);
    res.json({ data: widget });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/{widgetId}/reset:
 *   post:
 *     summary: Reset widget settings to defaults
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:widgetId/reset',
  asyncHandler(async (req, res) => {
    const { widgetId } = req.params;
    const result = await adminWidgetService.resetWidgetToDefaults(widgetId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/bulk:
 *   patch:
 *     summary: Bulk update widget settings
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/bulk',
  asyncHandler(async (req, res) => {
    const { widgetIds, data } = req.body;

    if (!widgetIds || !Array.isArray(widgetIds) || widgetIds.length === 0) {
      return res.status(400).json({ error: 'widgetIds array is required' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'data object is required' });
    }

    const result = await adminWidgetService.bulkUpdateWidgets(widgetIds, data);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/widgets/{widgetId}:
 *   delete:
 *     summary: Delete widget settings
 *     tags: [Admin - Widgets]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:widgetId',
  asyncHandler(async (req, res) => {
    const { widgetId } = req.params;
    const result = await adminWidgetService.deleteWidget(widgetId);
    res.json(result);
  })
);

export default router;
