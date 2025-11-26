/**
 * Sites Routes
 * Route handlers using SiteService for business logic
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams } from '../middleware/validate';
import { messageResponse } from '../utils/response';
import { siteService } from '../services';
import { settings } from '../lib/settings';
import {
  createSiteSchema,
  updateSiteSchema,
  siteParamsSchema,
  updateSelectionsSchema,
  bulkSelectSchema,
  addManualUrlsSchema,
  selectiveCrawlSchema,
} from '../schemas';
import { z } from 'zod';
import {
  discoverUrls,
  getDiscoveryResults,
  getDiscoveryStats,
  updateUrlSelections,
  addManualUrls,
  getSelectedUrlsForCrawl,
} from '../services/discovery/UrlDiscoveryService';
import { queueSelectiveCrawl } from '../queues';
import { prisma } from '../lib/prisma';

const router = Router();

// ============================================
// Site CRUD Operations
// ============================================

/**
 * @swagger
 * /api/v1/sites:
 *   get:
 *     summary: Get all sites for user
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const sites = await siteService.getSites(req.user!.id);
    res.json(sites.data);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}:
 *   get:
 *     summary: Get site by ID
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const site = await siteService.getSiteById(
      req.params.siteId,
      req.user!.id
    );
    res.json(site.data);
  })
);

/**
 * @swagger
 * /api/v1/sites:
 *   post:
 *     summary: Create a new site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  validateBody(createSiteSchema),
  asyncHandler(async (req, res) => {
    const site = await siteService.createSite(req.user!.id, req.body);
    res.status(201).json(site);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}:
 *   patch:
 *     summary: Update site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:siteId',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(updateSiteSchema),
  asyncHandler(async (req, res) => {
    const site = await siteService.updateSite(
      req.params.siteId,
      req.user!.id,
      req.body
    );
    res.json(site);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}:
 *   delete:
 *     summary: Delete site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:siteId',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    await siteService.deleteSite(req.params.siteId, req.user!.id);
    res.status(204).send();
  })
);

// ============================================
// Crawl Operations
// ============================================

/**
 * @swagger
 * /api/v1/sites/{siteId}/crawl:
 *   post:
 *     summary: Trigger site recrawl
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/crawl',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    await siteService.triggerCrawl(req.params.siteId, req.user!.id);
    res.json(messageResponse('Crawl initiated successfully'));
  })
);

// ============================================
// Conversation Starters
// ============================================

// Schema for updating starters
const updateStartersSchema = z.object({
  welcomeMessage: z.string().optional().nullable(),
  starters: z.array(z.string()).optional(),
});

/**
 * @swagger
 * /api/v1/sites/{siteId}/starters:
 *   get:
 *     summary: Get conversation starters
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId/starters',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const starters = await siteService.getStarters(
      req.params.siteId,
      req.user!.id
    );
    res.json(starters);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/starters:
 *   put:
 *     summary: Update conversation starters
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:siteId/starters',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(updateStartersSchema),
  asyncHandler(async (req, res) => {
    const starters = await siteService.updateStarters(
      req.params.siteId,
      req.user!.id,
      req.body
    );
    res.json(starters);
  })
);

// ============================================
// Active Hosts Management
// ============================================

// Schemas for host operations
const addHostSchema = z.object({
  hostName: z.string().min(1, 'Host name is required'),
  isEnabled: z.boolean().optional().default(true),
});

const updateHostSchema = z.object({
  isEnabled: z.boolean(),
});

const hostParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  hostId: z.string().min(1, 'Host ID is required'),
});

/**
 * @swagger
 * /api/v1/sites/{siteId}/hosts:
 *   get:
 *     summary: Get active hosts
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId/hosts',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const hosts = await siteService.getHosts(
      req.params.siteId,
      req.user!.id
    );
    res.json(hosts);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/hosts:
 *   post:
 *     summary: Add active host
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/hosts',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(addHostSchema),
  asyncHandler(async (req, res) => {
    const host = await siteService.addHost(
      req.params.siteId,
      req.user!.id,
      req.body
    );
    res.status(201).json({ host });
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/hosts/{hostId}:
 *   patch:
 *     summary: Update active host
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:siteId/hosts/:hostId',
  authenticate,
  validateParams(hostParamsSchema),
  validateBody(updateHostSchema),
  asyncHandler(async (req, res) => {
    const host = await siteService.updateHost(
      req.params.siteId,
      req.params.hostId,
      req.user!.id,
      req.body.isEnabled
    );
    res.json({ host });
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/hosts/{hostId}:
 *   delete:
 *     summary: Remove active host
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:siteId/hosts/:hostId',
  authenticate,
  validateParams(hostParamsSchema),
  asyncHandler(async (req, res) => {
    await siteService.deleteHost(
      req.params.siteId,
      req.params.hostId,
      req.user!.id
    );
    res.json(messageResponse('Host removed successfully'));
  })
);

// ============================================
// URL Discovery Operations
// ============================================

/**
 * @swagger
 * /api/v1/sites/{siteId}/discover:
 *   post:
 *     summary: Start URL discovery
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/discover',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Check for forceRefresh query param
    const forceRefresh = req.query.forceRefresh === 'true';

    // Start discovery (runs async)
    discoverUrls(req.params.siteId, { forceRefresh }).catch(err => {
      console.error('Discovery error:', err);
    });

    res.json(messageResponse(forceRefresh ? 'URL discovery started (cache bypassed)' : 'URL discovery started'));
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/discovery:
 *   get:
 *     summary: Get discovery results
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId/discovery',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const results = await getDiscoveryResults(req.params.siteId);
    res.json(results);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/discovery/stats:
 *   get:
 *     summary: Get discovery statistics
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:siteId/discovery/stats',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const stats = await getDiscoveryStats(req.params.siteId);
    res.json(stats);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/discovery/selections:
 *   put:
 *     summary: Update URL selections
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:siteId/discovery/selections',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(updateSelectionsSchema),
  asyncHandler(async (req, res) => {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const result = await updateUrlSelections(req.params.siteId, req.body.selections);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/discovery/bulk-select:
 *   post:
 *     summary: Bulk select/deselect URLs
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/discovery/bulk-select',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(bulkSelectSchema),
  asyncHandler(async (req, res) => {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const { action, category, priority } = req.body;

    // Build filter
    const whereClause: { siteId: string; category?: string; priority?: string } = {
      siteId: req.params.siteId,
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    // Update selections
    await prisma.urlSelection.updateMany({
      where: whereClause,
      data: { selected: action === 'select' },
    });

    // Get updated counts
    const selectedCount = await prisma.urlSelection.count({
      where: { siteId: req.params.siteId, selected: true },
    });

    const estimatedCrawlTime = Math.ceil(selectedCount / 5) * 10;

    res.json({ selectedCount, estimatedCrawlTime });
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/discovery/manual-urls:
 *   post:
 *     summary: Add manual URLs
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/discovery/manual-urls',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(addManualUrlsSchema),
  asyncHandler(async (req, res) => {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const added = await addManualUrls(req.params.siteId, req.body.urls);
    res.json({ added, count: added.length });
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/crawl/selective:
 *   post:
 *     summary: Start selective crawl
 *     tags: [Sites, Discovery]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/crawl/selective',
  authenticate,
  validateParams(siteParamsSchema),
  validateBody(selectiveCrawlSchema),
  asyncHandler(async (req, res) => {
    const { getSitePlanLimits } = await import('../config/planLimits');

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Get plan limits
    const planLimits = await getSitePlanLimits(req.params.siteId);

    // Get selected URLs - prefer URLs from request body (avoids race condition with async selection updates)
    // If URLs are provided in the request, use those directly instead of reading from database
    let selectedUrls: string[];
    const urlsFromBody = req.body.urls;
    const urlsSource = urlsFromBody && urlsFromBody.length > 0 ? 'request' : 'database';

    if (urlsFromBody && urlsFromBody.length > 0) {
      selectedUrls = urlsFromBody;
      console.log(`[Selective Crawl] Using ${selectedUrls.length} URLs from request body for site ${req.params.siteId}`);
    } else {
      // Fallback to database selections (for backwards compatibility)
      selectedUrls = await getSelectedUrlsForCrawl(req.params.siteId);
      console.log(`[Selective Crawl] Using ${selectedUrls.length} URLs from database for site ${req.params.siteId} (request body had: ${JSON.stringify(urlsFromBody)})`);
    }

    if (selectedUrls.length === 0) {
      return res.status(400).json({ error: 'No URLs selected for crawling' });
    }

    // Enforce plan limits - limit URLs to max allowed
    const wasLimited = selectedUrls.length > planLimits.maxUrls;
    if (wasLimited) {
      selectedUrls = selectedUrls.slice(0, planLimits.maxUrls);
    }

    // Queue selective crawl
    await queueSelectiveCrawl(req.params.siteId, selectedUrls);

    const estimatedTime = Math.ceil(selectedUrls.length / planLimits.concurrency) * 10;

    res.json({
      message: 'Selective crawl started',
      urlCount: selectedUrls.length,
      urlsSource, // 'request' or 'database' - helps debug where URLs came from
      estimatedTime,
      wasLimited,
      maxUrls: planLimits.maxUrls,
    });
  })
);

// ============================================
// Trial Status
// ============================================

/**
 * @swagger
 * /api/v1/sites/{siteId}/trial-status:
 *   get:
 *     summary: Get trial status for a site
 *     description: Returns trial status including remaining days, conversations, and messages
 *     tags: [Sites]
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
 *         description: Trial status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isInTrial:
 *                   type: boolean
 *                   description: Whether the site is currently in trial
 *                 trialExpired:
 *                   type: boolean
 *                   description: Whether the trial has expired
 *                 reason:
 *                   type: string
 *                   description: Reason for trial expiration (if applicable)
 *                 daysRemaining:
 *                   type: number
 *                   description: Days remaining in trial
 *                 conversationsRemaining:
 *                   type: number
 *                   description: Conversations remaining in trial
 *                 messagesRemaining:
 *                   type: number
 *                   description: Messages remaining in trial
 *                 limits:
 *                   type: object
 *                   properties:
 *                     maxDays:
 *                       type: number
 *                     maxConversations:
 *                       type: number
 *                     maxMessages:
 *                       type: number
 *                     maxUrls:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site not found
 */
router.get(
  '/:siteId/trial-status',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { getSitePlanLimits } = await import('../config/planLimits');

    // Verify site ownership and get subscription
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, userId: req.user!.id },
      include: {
        subscription: {
          select: {
            status: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const [trialDays, planLimits] = await Promise.all([
      settings.getTrialDays(),
      getSitePlanLimits(req.params.siteId),
    ]);

    // Calculate days remaining if in trial
    let daysRemaining: number | undefined;
    if (site.subscription?.status === 'TRIAL' && site.subscription.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(site.subscription.trialEndsAt);
      daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    res.json({
      isInTrial: site.subscription?.status === 'TRIAL',
      trialExpired: site.subscription?.status === 'EXPIRED' || site.subscription?.status === 'CANCELLED',
      daysRemaining,
      limits: {
        maxDays: trialDays,
        maxUrls: planLimits.maxUrls,
      },
    });
  })
);

// ============================================
// Crawl Control (Pause/Resume)
// ============================================

/**
 * @swagger
 * /api/v1/sites/{siteId}/crawl/pause:
 *   post:
 *     summary: Pause crawl for a site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/crawl/pause',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: req.user!.id },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Only allow pausing during active crawl/processing
    if (!['CRAWLING', 'PROCESSING'].includes(site.crawlStatus)) {
      return res.status(400).json({
        error: 'Cannot pause: crawl is not in progress',
        currentStatus: site.crawlStatus,
      });
    }

    // Import cacheService here to avoid circular dependency
    const { cacheService } = await import('../services/cache');

    // Set pause flag
    await cacheService.setCrawlPaused(siteId, true);

    // Update site status
    await prisma.site.update({
      where: { id: siteId },
      data: { crawlStatus: 'PAUSED' },
    });

    // Emit socket event
    const { getIO } = await import('../services/socket');
    const io = getIO();
    if (io) {
      io.to(`site:${siteId}`).emit('crawl-status-update', {
        siteId,
        crawlStatus: 'PAUSED',
      });
    }

    res.json(messageResponse('Crawl paused successfully'));
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/crawl/resume:
 *   post:
 *     summary: Resume paused crawl for a site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:siteId/crawl/resume',
  authenticate,
  validateParams(siteParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: req.user!.id },
      include: {
        urls: {
          where: {
            embeddingStatus: { in: ['PENDING', 'SCRAPED'] },
            isExcluded: false,
          },
          select: { url: true },
        },
      },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Only allow resuming if paused
    if (site.crawlStatus !== 'PAUSED') {
      return res.status(400).json({
        error: 'Cannot resume: crawl is not paused',
        currentStatus: site.crawlStatus,
      });
    }

    // Import cacheService here to avoid circular dependency
    const { cacheService } = await import('../services/cache');
    const { clearAbortFlag } = await import('../services/crawler');

    // Clear pause flag and abort flag
    await cacheService.setCrawlPaused(siteId, false);
    clearAbortFlag(siteId);

    // Determine what to resume: crawling or embedding
    const pendingCrawlUrls = site.urls.filter(u => u.url).map(u => u.url);

    if (pendingCrawlUrls.length > 0) {
      // Resume crawling
      await prisma.site.update({
        where: { id: siteId },
        data: { crawlStatus: 'CRAWLING' },
      });

      // Re-queue the selective crawl with remaining URLs
      await queueSelectiveCrawl(siteId, pendingCrawlUrls);
    } else {
      // Resume embedding (all URLs already scraped)
      await prisma.site.update({
        where: { id: siteId },
        data: { crawlStatus: 'PROCESSING' },
      });

      // Re-queue embedding job
      const { queueEmbeddingGeneration } = await import('../queues');
      await queueEmbeddingGeneration(siteId, req.user!.id);
    }

    // Emit socket event
    const { getIO } = await import('../services/socket');
    const io = getIO();
    if (io) {
      io.to(`site:${siteId}`).emit('crawl-status-update', {
        siteId,
        crawlStatus: pendingCrawlUrls.length > 0 ? 'CRAWLING' : 'PROCESSING',
      });
    }

    res.json(messageResponse('Crawl resumed successfully'));
  })
);

export default router;
