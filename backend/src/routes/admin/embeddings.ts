/**
 * Admin Embeddings Routes
 * Route handlers for admin embedding management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminEmbeddingService } from '../../services/admin';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/embeddings:
 *   get:
 *     summary: Get paginated list of embeddings
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      siteUrlId,
      siteId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminEmbeddingService.getEmbeddings({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      siteUrlId: siteUrlId as string | undefined,
      siteId: siteId as string | undefined,
      sortBy: sortBy as 'createdAt' | 'chunkIndex',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/embeddings/{embeddingId}:
 *   get:
 *     summary: Get embedding by ID
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:embeddingId',
  asyncHandler(async (req, res) => {
    const { embeddingId } = req.params;
    const embedding = await adminEmbeddingService.getEmbeddingById(embeddingId);
    res.json({ data: embedding });
  })
);

/**
 * @swagger
 * /api/v1/admin/embeddings/{embeddingId}:
 *   delete:
 *     summary: Delete embedding
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:embeddingId',
  asyncHandler(async (req, res) => {
    const { embeddingId } = req.params;
    const result = await adminEmbeddingService.deleteEmbedding(embeddingId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/embeddings/bulk/delete:
 *   post:
 *     summary: Bulk delete embeddings
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bulk/delete',
  asyncHandler(async (req, res) => {
    const { embeddingIds } = req.body;
    const result = await adminEmbeddingService.bulkDeleteEmbeddings(embeddingIds);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/embeddings/site/{siteId}:
 *   delete:
 *     summary: Delete all embeddings for a site
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/site/:siteId',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await adminEmbeddingService.deleteAllSiteEmbeddings(siteId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/embeddings/site/{siteId}/stats:
 *   get:
 *     summary: Get embedding statistics for a site
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/site/:siteId/stats',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const stats = await adminEmbeddingService.getSiteEmbeddingStats(siteId);
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/embeddings/pinecone/all:
 *   delete:
 *     summary: Delete ALL vectors from Pinecone index (DANGER ZONE)
 *     description: This is a destructive operation that wipes the entire Pinecone index and clears all embedding records from the database. Use with extreme caution.
 *     tags: [Admin - Embeddings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/pinecone/all',
  asyncHandler(async (req, res) => {
    const result = await adminEmbeddingService.deleteAllPineconeData();
    res.json(result);
  })
);

export default router;
