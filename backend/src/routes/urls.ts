/**
 * URLs Routes
 * Route handlers for URL management using UrlService
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams } from '../middleware/validate';
import { messageResponse } from '../utils/response';
import { urlService } from '../services/url/UrlService';
import { addUrlsSchema, updateUrlSchema, updateContentSchema } from '../schemas';
import { z } from 'zod';

const router = Router({ mergeParams: true });

// Validation schemas
const urlParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  urlId: z.string().min(1, 'URL ID is required'),
});

const siteParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
});

// ============================================
// URL Management
// ============================================

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls:
 *   get:
 *     summary: Get site URLs
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const { search, status } = req.query;

    const urls = await urlService.getSiteUrls(
      siteId,
      req.user!.id,
      {
        search: search as string,
        status: status as 'active' | 'excluded',
      }
    );

    res.json(urls);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls/{urlId}:
 *   get:
 *     summary: Get single URL details
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:urlId',
  authenticate,
  validateParams(urlParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, urlId } = req.params;

    const url = await urlService.getUrlById(
      siteId,
      urlId,
      req.user!.id
    );

    res.json(url);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls:
 *   post:
 *     summary: Add new URLs
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(addUrlsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    const result = await urlService.addUrls(
      siteId,
      req.user!.id,
      req.body
    );

    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls/{urlId}:
 *   patch:
 *     summary: Update URL settings
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:urlId',
  authenticate,
  validateParams(urlParamsSchema),
  validateBody(updateUrlSchema),
  asyncHandler(async (req, res) => {
    const { siteId, urlId } = req.params;

    const url = await urlService.updateUrl(
      siteId,
      urlId,
      req.user!.id,
      req.body
    );

    res.json(url);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls/{urlId}/content:
 *   put:
 *     summary: Update URL content
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:urlId/content',
  authenticate,
  validateParams(urlParamsSchema),
  validateBody(updateContentSchema),
  asyncHandler(async (req, res) => {
    const { siteId, urlId } = req.params;

    const url = await urlService.updateUrlContent(
      siteId,
      urlId,
      req.user!.id,
      req.body
    );

    res.json(url);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls/{urlId}/crawl:
 *   post:
 *     summary: Trigger URL recrawl
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:urlId/crawl',
  authenticate,
  validateParams(urlParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, urlId } = req.params;

    await urlService.crawlUrl(siteId, urlId, req.user!.id);

    res.json(messageResponse('Crawl initiated successfully'));
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/urls/{urlId}:
 *   delete:
 *     summary: Delete URL
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:urlId',
  authenticate,
  validateParams(urlParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, urlId } = req.params;

    await urlService.deleteUrl(siteId, urlId, req.user!.id);

    res.status(204).send();
  })
);

export default router;
