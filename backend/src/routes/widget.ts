/**
 * Widget Routes
 * Route handlers for widget configuration using WidgetService
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateParams } from '../middleware/validate';
import { widgetService } from '../services/widget/WidgetService';
import { widgetCorsMiddleware } from '../middleware/widgetCors';
import { AppError, ErrorCode } from '../middleware/errors';
import { z } from 'zod';

const router = Router();

// Apply custom CORS middleware to all widget routes
router.use(widgetCorsMiddleware);

// Validation schemas
const siteParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
});

const categoryParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  category: z.string().min(1, 'Category is required'),
});

const conversationParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
});

// Configure multer for logo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max for logo images
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          'File type not supported. Allowed types: PNG, JPEG, SVG, WebP'
        )
      );
    }
    cb(null, true);
  },
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

/**
 * @swagger
 * /api/v1/widget/{siteId}/conversation/{sessionId}:
 *   get:
 *     summary: Get conversation history by session ID (public)
 *     tags: [Widget]
 */
router.get(
  '/:siteId/conversation/:sessionId',
  validateParams(conversationParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, sessionId } = req.params;

    const conversation = await widgetService.getConversationHistory(siteId, sessionId);
    res.json(conversation);
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

/**
 * @swagger
 * /api/v1/widget/{siteId}/logo:
 *   post:
 *     summary: Upload a custom launcher logo
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/logo',
  authenticate,
  validateParams(siteParamsSchema),
  upload.single('logo'),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    if (!req.file) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'No logo file provided');
    }

    const logoUrl = await widgetService.uploadLogo(siteId, req.user!.id, req.file);

    res.json({
      success: true,
      logoUrl,
      message: 'Logo uploaded successfully',
    });
  })
);

/**
 * @swagger
 * /api/v1/widget/{siteId}/logo:
 *   delete:
 *     summary: Delete custom launcher logo
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:siteId/logo',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    await widgetService.deleteLogo(siteId, req.user!.id);

    res.json({
      success: true,
      message: 'Logo deleted successfully',
    });
  })
);

export default router;
