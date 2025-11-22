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
import {
  createSiteSchema,
  updateSiteSchema,
  siteParamsSchema,
} from '../schemas';
import { z } from 'zod';

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

export default router;
