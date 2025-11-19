import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { queueCrawl } from '../queues';
import { CrawlStatus } from '@prisma/client';

const router = Router();

// Validation schemas
const createSiteSchema = z.object({
  siteUrl: z.string().url(),
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  siteIndustry: z.string().optional(),
});

const updateSiteSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  siteIndustry: z.string().optional(),
  specialInstructions: z.string().optional(),
  welcomeMessage: z.string().optional(),
});

/**
 * @swagger
 * /api/sites:
 *   get:
 *     summary: Get all sites for user
 *     description: Retrieve all sites owned by the authenticated user
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user sites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Site'
 *                   - type: object
 *                     properties:
 *                       urlCount:
 *                         type: integer
 *                         description: Number of URLs for this site
 *                       subscription:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           status:
 *                             type: string
 *                             enum: [TRIAL, ACTIVE, CANCELLED, EXPIRED, PAST_DUE]
 *                           planType:
 *                             type: string
 *                             enum: [PREMIUM_MONTHLY, PREMIUM_ANNUAL]
 *                           trialEndsAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           currentPeriodEnd:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sites = await prisma.site.findMany({
      where: { userId: req.user!.id },
      include: {
        urls: {
          where: { isActive: true, isExcluded: false },
          select: { id: true },
        },
        subscription: {
          select: {
            status: true,
            planType: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    const sitesWithCount = sites.map(site => ({
      ...site,
      urlCount: site.urls.length,
      urls: undefined,
    }));

    res.json(sitesWithCount);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}:
 *   get:
 *     summary: Get site by ID
 *     description: Retrieve a specific site by its ID
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
 *         description: Site details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Site'
 *                 - type: object
 *                   properties:
 *                     urlCount:
 *                       type: integer
 *                       description: Number of URLs for this site
 *                     subscription:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [TRIAL, ACTIVE, CANCELLED, EXPIRED, PAST_DUE]
 *                         planType:
 *                           type: string
 *                           enum: [PREMIUM_MONTHLY, PREMIUM_ANNUAL]
 *                         trialEndsAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         currentPeriodStart:
 *                           type: string
 *                           format: date-time
 *                         currentPeriodEnd:
 *                           type: string
 *                           format: date-time
 *                         cancelledAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                     _count:
 *                       type: object
 *                       properties:
 *                         urls:
 *                           type: integer
 *                         conversations:
 *                           type: integer
 *                         knowledgeFiles:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId', authenticate, async (req, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.siteId,
        userId: req.user!.id,
      },
      include: {
        subscription: true,
        activeHosts: true,
        _count: {
          select: {
            urls: true,
            conversations: true,
            knowledgeFiles: true,
          },
        },
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    res.json(site);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites:
 *   post:
 *     summary: Create a new site
 *     description: Create a new site and start crawling it
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteUrl
 *             properties:
 *               siteUrl:
 *                 type: string
 *                 format: uri
 *                 description: Website URL to crawl
 *                 example: https://example.com
 *               siteName:
 *                 type: string
 *                 description: Optional site name
 *                 example: My Website
 *               siteDescription:
 *                 type: string
 *                 description: Optional site description
 *                 example: A great website about technology
 *               siteIndustry:
 *                 type: string
 *                 description: Optional site industry
 *                 example: Technology
 *     responses:
 *       201:
 *         description: Site created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Site already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createSiteSchema.parse(req.body);

    // Normalize URL
    let normalizedUrl = data.siteUrl.toLowerCase();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    // Check if site already exists for user
    const existingSite = await prisma.site.findFirst({
      where: {
        userId: req.user!.id,
        siteUrl: normalizedUrl,
      },
    });

    if (existingSite) {
      throw new AppError(409, 'Site already exists');
    }

    // Create site
    const site = await prisma.site.create({
      data: {
        userId: req.user!.id,
        siteUrl: normalizedUrl,
        siteName: data.siteName || normalizedUrl,
        siteDescription: data.siteDescription,
        siteIndustry: data.siteIndustry,
        crawlStatus: CrawlStatus.PENDING,
      },
    });

    // Create default active host
    await prisma.activeHost.create({
      data: {
        siteId: site.id,
        hostName: normalizedUrl,
        isEnabled: true,
      },
    });

    // Queue crawl job
    await queueCrawl(site.id, 'full');

    res.status(201).json(site);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}:
 *   patch:
 *     summary: Update site
 *     description: Update site information
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *                 description: Site name
 *               siteDescription:
 *                 type: string
 *                 description: Site description
 *               siteIndustry:
 *                 type: string
 *                 description: Site industry
 *               specialInstructions:
 *                 type: string
 *                 description: Special instructions for AI
 *               welcomeMessage:
 *                 type: string
 *                 description: Welcome message for visitors
 *     responses:
 *       200:
 *         description: Site updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:siteId', authenticate, async (req, res, next) => {
  try {
    const data = updateSiteSchema.parse(req.body);

    // Check ownership
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Update site
    const updatedSite = await prisma.site.update({
      where: { id: req.params.siteId },
      data,
    });

    res.json(updatedSite);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}:
 *   delete:
 *     summary: Delete site
 *     description: Delete a site and all its associated data
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
 *       204:
 *         description: Site deleted successfully
 *       400:
 *         description: Cannot delete site with active subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:siteId', authenticate, async (req, res, next) => {
  try {
    // Check ownership and subscription
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.siteId,
        userId: req.user!.id,
      },
      include: {
        subscription: true,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    if (site.subscription && site.subscription.status === 'ACTIVE') {
      throw new AppError(400, 'Cannot delete site with active subscription');
    }

    // Delete site (cascade will handle related records)
    await prisma.site.delete({
      where: { id: req.params.siteId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/crawl:
 *   post:
 *     summary: Trigger site recrawl
 *     description: Start a new crawl of the site to update content
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
 *         description: Crawl initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Crawl initiated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:siteId/crawl', authenticate, async (req, res, next) => {
  try {
    // Check ownership
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Update crawl status
    await prisma.site.update({
      where: { id: req.params.siteId },
      data: { crawlStatus: CrawlStatus.PENDING },
    });

    // Queue crawl job
    await queueCrawl(req.params.siteId, 'full');

    res.json({ message: 'Crawl initiated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/starters:
 *   get:
 *     summary: Get conversation starters
 *     description: Retrieve conversation starters for a site
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
 *         description: Conversation starters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 welcomeMessage:
 *                   type: string
 *                   nullable: true
 *                   description: Welcome message for the chatbot
 *                 starters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       starterText:
 *                         type: string
 *                       orderIndex:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/starters', authenticate, async (req, res, next) => {
  try {
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.siteId,
        userId: req.user!.id,
      },
      include: {
        conversationStarters: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    res.json({
      welcomeMessage: site.welcomeMessage,
      starters: site.conversationStarters,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/starters:
 *   put:
 *     summary: Update conversation starters
 *     description: Update welcome message and conversation starters for a site
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               welcomeMessage:
 *                 type: string
 *                 nullable: true
 *                 description: Welcome message for the chatbot
 *                 example: Welcome! How can I help you today?
 *               starters:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of conversation starter texts
 *                 example: ["What services do you offer?", "How can I contact support?"]
 *     responses:
 *       200:
 *         description: Starters updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Starters updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:siteId/starters', authenticate, async (req, res, next) => {
  try {
    const { welcomeMessage, starters } = req.body;

    // Check ownership
    const site = await prisma.site.findFirst({
      where: {
        id: req.params.siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Update welcome message
    if (welcomeMessage !== undefined) {
      await prisma.site.update({
        where: { id: req.params.siteId },
        data: { welcomeMessage },
      });
    }

    // Update starters
    if (starters && Array.isArray(starters)) {
      // Delete existing starters
      await prisma.conversationStarter.deleteMany({
        where: { siteId: req.params.siteId },
      });

      // Create new starters
      if (starters.length > 0) {
        await prisma.conversationStarter.createMany({
          data: starters.map((text: string, index: number) => ({
            siteId: req.params.siteId,
            starterText: text,
            orderIndex: index,
            isActive: true,
          })),
        });
      }
    }

    res.json({ message: 'Starters updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/hosts:
 *   get:
 *     summary: Get active hosts for a site
 *     description: Retrieve all active hostnames configured for a site
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
 *         description: Active hosts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       hostName:
 *                         type: string
 *                       hostname:
 *                         type: string
 *                         description: Alias for hostName
 *                       isActive:
 *                         type: boolean
 *                       isEnabled:
 *                         type: boolean
 *                         description: Alias for isActive
 *                       lastSeenAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/hosts', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    const hosts = await prisma.activeHost.findMany({
      where: { siteId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ hosts });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/hosts:
 *   post:
 *     summary: Add active host for a site
 *     description: Add a new hostname that can access the widget for this site
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostName
 *             properties:
 *               hostName:
 *                 type: string
 *                 description: Hostname (e.g., example.com, www.example.com)
 *                 example: example.com
 *               isEnabled:
 *                 type: boolean
 *                 default: true
 *                 description: Whether this host is enabled
 *     responses:
 *       201:
 *         description: Host added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 host:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     hostName:
 *                       type: string
 *                     isEnabled:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Host added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Host already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:siteId/hosts', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { hostName, isEnabled = true } = req.body;

    if (!hostName || typeof hostName !== 'string') {
      throw new AppError(400, 'Valid hostName is required');
    }

    // Clean and validate hostname
    const cleanHostName = hostName.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Basic hostname validation
    const hostRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/;
    if (!hostRegex.test(cleanHostName)) {
      throw new AppError(400, 'Invalid hostname format');
    }

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check if host already exists
    const existingHost = await prisma.activeHost.findFirst({
      where: {
        siteId,
        hostName: cleanHostName,
      },
    });

    if (existingHost) {
      throw new AppError(409, 'Host already exists for this site');
    }

    // Create new host
    const host = await prisma.activeHost.create({
      data: {
        siteId,
        hostName: cleanHostName,
        isEnabled: Boolean(isEnabled),
      },
    });

    res.status(201).json({
      host,
      message: 'Host added successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/hosts/{hostId}:
 *   patch:
 *     summary: Update active host settings
 *     description: Update hostname or enable/disable status for an active host
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
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema:
 *           type: string
 *         description: Host ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hostName:
 *                 type: string
 *                 description: Updated hostname
 *               isEnabled:
 *                 type: boolean
 *                 description: Enable or disable this host
 *     responses:
 *       200:
 *         description: Host updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 host:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     hostName:
 *                       type: string
 *                     isEnabled:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Host updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:siteId/hosts/:hostId', authenticate, async (req, res, next) => {
  try {
    const { siteId, hostId } = req.params;
    const updates: any = {};

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check if host exists and belongs to the site
    const existingHost = await prisma.activeHost.findFirst({
      where: {
        id: hostId,
        siteId,
      },
    });

    if (!existingHost) {
      throw new AppError(404, 'Host not found');
    }

    // Process hostname update
    if (req.body.hostName !== undefined) {
      const hostName = req.body.hostName;

      if (!hostName || typeof hostName !== 'string') {
        throw new AppError(400, 'Valid hostName is required');
      }

      const cleanHostName = hostName.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Validate hostname format
      const hostRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/;
      if (!hostRegex.test(cleanHostName)) {
        throw new AppError(400, 'Invalid hostname format');
      }

      // Check if another host with this name already exists
      const duplicateHost = await prisma.activeHost.findFirst({
        where: {
          siteId,
          hostName: cleanHostName,
          id: { not: hostId },
        },
      });

      if (duplicateHost) {
        throw new AppError(409, 'Another host with this hostname already exists');
      }

      updates.hostName = cleanHostName;
    }

    // Process isEnabled update
    if (req.body.isEnabled !== undefined) {
      updates.isEnabled = Boolean(req.body.isEnabled);
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(400, 'No valid fields to update');
    }

    // Update the host
    const updatedHost = await prisma.activeHost.update({
      where: { id: hostId },
      data: updates,
    });

    res.json({
      host: updatedHost,
      message: 'Host updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/hosts/{hostId}:
 *   delete:
 *     summary: Remove active host
 *     description: Remove a hostname from the list of allowed hosts for a site
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
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema:
 *           type: string
 *         description: Host ID
 *     responses:
 *       200:
 *         description: Host removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Host removed successfully
 *       400:
 *         description: Cannot remove the last host
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:siteId/hosts/:hostId', authenticate, async (req, res, next) => {
  try {
    const { siteId, hostId } = req.params;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check if host exists and belongs to the site
    const host = await prisma.activeHost.findFirst({
      where: {
        id: hostId,
        siteId,
      },
    });

    if (!host) {
      throw new AppError(404, 'Host not found');
    }

    // Check if this is the last host (optional: prevent removing all hosts)
    const hostCount = await prisma.activeHost.count({
      where: { siteId },
    });

    if (hostCount === 1) {
      throw new AppError(400, 'Cannot remove the last host. Add another host before removing this one.');
    }

    // Delete the host
    await prisma.activeHost.delete({
      where: { id: hostId },
    });

    res.json({ message: 'Host removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;