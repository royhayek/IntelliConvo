/**
 * Admin Sites Routes
 * Route handlers for admin site management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

import { adminSiteService } from '../../services/admin';
import { CrawlStatus } from '@prisma/client';

const router = Router();

// ============================================
// Site Management Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/sites:
 *   get:
 *     summary: Get paginated list of sites
 *     description: Returns a paginated list of sites with search and filter options
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by site name or URL
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: crawlStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED]
 *         description: Filter by crawl status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, siteName, lastCrawledAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Sites list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      search,
      userId,
      crawlStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminSiteService.getSites({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      userId: userId as string | undefined,
      crawlStatus: crawlStatus as CrawlStatus | undefined,
      sortBy: sortBy as 'createdAt' | 'siteName' | 'lastCrawledAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/sites/export:
 *   get:
 *     summary: Export sites
 *     description: Export sites as CSV or JSON
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { format = 'json', search, userId, crawlStatus } = req.query;

    const result = await adminSiteService.exportSites(
      format as 'csv' | 'json',
      {
        search: search as string | undefined,
        userId: userId as string | undefined,
        crawlStatus: crawlStatus as CrawlStatus | undefined,
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
 * /api/v1/admin/sites/{siteId}:
 *   get:
 *     summary: Get site by ID
 *     description: Returns detailed information about a specific site including stats
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site retrieved successfully
 *       404:
 *         description: Site not found
 */
router.get(
  '/:siteId',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const site = await adminSiteService.getSiteById(siteId);
    res.json({ data: site });
  })
);

/**
 * @swagger
 * /api/v1/admin/sites/{siteId}:
 *   patch:
 *     summary: Update site
 *     description: Update site information
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *               siteDescription:
 *                 type: string
 *               siteIndustry:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *               welcomeMessage:
 *                 type: string
 *               crawlStatus:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       404:
 *         description: Site not found
 */
router.patch(
  '/:siteId',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const { siteName, siteDescription, siteIndustry, specialInstructions, startersHeadline, crawlStatus } = req.body;

    const updatedSite = await adminSiteService.updateSite(siteId, {
      siteName,
      siteDescription,
      siteIndustry,
      specialInstructions,
      startersHeadline,
      crawlStatus,
    });

    res.json({ data: updatedSite });
  })
);

/**
 * @swagger
 * /api/v1/admin/sites/{siteId}:
 *   delete:
 *     summary: Delete site
 *     description: Delete a site and all associated data (URLs, embeddings, conversations, etc.)
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *       404:
 *         description: Site not found
 */
router.delete(
  '/:siteId',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await adminSiteService.deleteSite(siteId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/sites/{siteId}/recrawl:
 *   post:
 *     summary: Trigger site recrawl
 *     description: Mark a site for recrawling
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site marked for recrawl successfully
 *       404:
 *         description: Site not found
 */
router.post(
  '/:siteId/recrawl',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await adminSiteService.triggerRecrawl(siteId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/sites/{siteId}/cache/clear:
 *   post:
 *     summary: Clear site cache
 *     description: Clear all cached data for a specific site
 *     tags: [Admin - Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       404:
 *         description: Site not found
 */
router.post(
  '/:siteId/cache/clear',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await adminSiteService.clearSiteCache(siteId);
    res.json({
      data: {
        ...result,
        message: 'Site cache cleared successfully',
      },
    });
  })
);

export default router;
