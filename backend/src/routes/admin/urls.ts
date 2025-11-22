/**
 * Admin URLs Routes
 * Route handlers for admin URL management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminUrlService } from '../../services/admin';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/urls:
 *   get:
 *     summary: Get paginated list of URLs
 *     tags: [Admin - URLs]
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
      siteId,
      isActive,
      isExcluded,
      hasEmbeddings,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminUrlService.getUrls({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      siteId: siteId as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isExcluded: isExcluded === 'true' ? true : isExcluded === 'false' ? false : undefined,
      hasEmbeddings: hasEmbeddings === 'true' ? true : hasEmbeddings === 'false' ? false : undefined,
      sortBy: sortBy as 'createdAt' | 'lastCrawledAt' | 'url',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/urls/{urlId}:
 *   get:
 *     summary: Get URL by ID
 *     tags: [Admin - URLs]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:urlId',
  asyncHandler(async (req, res) => {
    const { urlId } = req.params;
    const url = await adminUrlService.getUrlById(urlId);
    res.json({ data: url });
  })
);

/**
 * @swagger
 * /api/v1/admin/urls/{urlId}:
 *   patch:
 *     summary: Update URL
 *     tags: [Admin - URLs]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:urlId',
  asyncHandler(async (req, res) => {
    const { urlId } = req.params;
    const { isActive, isExcluded, title } = req.body;

    const updatedUrl = await adminUrlService.updateUrl(urlId, {
      isActive,
      isExcluded,
      title,
    });

    res.json({ data: updatedUrl });
  })
);

/**
 * @swagger
 * /api/v1/admin/urls/{urlId}:
 *   delete:
 *     summary: Delete URL
 *     tags: [Admin - URLs]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:urlId',
  asyncHandler(async (req, res) => {
    const { urlId } = req.params;
    const result = await adminUrlService.deleteUrl(urlId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/urls/bulk/update:
 *   post:
 *     summary: Bulk update URLs status
 *     tags: [Admin - URLs]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bulk/update',
  asyncHandler(async (req, res) => {
    const { urlIds, isActive, isExcluded } = req.body;
    const result = await adminUrlService.bulkUpdateUrls(urlIds, { isActive, isExcluded });
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/urls/{urlId}/embeddings:
 *   delete:
 *     summary: Delete all embeddings for a URL
 *     tags: [Admin - URLs]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:urlId/embeddings',
  asyncHandler(async (req, res) => {
    const { urlId } = req.params;
    const result = await adminUrlService.deleteUrlEmbeddings(urlId);
    res.json(result);
  })
);

export default router;
