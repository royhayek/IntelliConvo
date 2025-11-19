import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { queueCrawl } from '../queues';
import { generateEmbeddings } from '../services/embeddings';

// Initialize Pinecone if configured
let pinecone: Pinecone | null = null;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || '';

if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== 'your_pinecone_api_key_here') {
  try {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  } catch (error) {
    console.warn('Failed to initialize Pinecone:', error);
  }
}

const router = Router({ mergeParams: true });

// Validation schemas
const addUrlsSchema = z.object({
  urls: z.array(z.string().url()),
});

const updateUrlSchema = z.object({
  isActive: z.boolean().optional(),
  isExcluded: z.boolean().optional(),
});

const updateContentSchema = z.object({
  content: z.string().min(1),
});

/**
 * @swagger
 * /api/sites/{siteId}/urls:
 *   get:
 *     summary: Get site URLs
 *     description: Retrieve all URLs for a specific site
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering URLs
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, excluded]
 *         description: Filter by URL status
 *     responses:
 *       200:
 *         description: List of site URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   url:
 *                     type: string
 *                   title:
 *                     type: string
 *                     nullable: true
 *                   isActive:
 *                     type: boolean
 *                   isExcluded:
 *                     type: boolean
 *                   lastCrawledAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site not found
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { search, status } = req.query;

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

    // Build filters
    const filters: any = { siteId };

    if (search) {
      filters.OR = [
        { url: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      filters.isActive = true;
      filters.isExcluded = false;
    } else if (status === 'excluded') {
      filters.isExcluded = true;
    }

    const urls = await prisma.siteUrl.findMany({
      where: filters,
      orderBy: { lastCrawledAt: 'desc' },
      select: {
        id: true,
        url: true,
        title: true,
        isActive: true,
        isExcluded: true,
        lastCrawledAt: true,
      },
    });

    res.json(urls);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/urls:
 *   post:
 *     summary: Add new URLs
 *     description: Add new URLs to a site for crawling
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
 *               - urls
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       201:
 *         description: URLs added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site not found
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { urls } = addUrlsSchema.parse(req.body);

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

    const createdUrls = [];

    for (const url of urls) {
      // Check if URL already exists
      const existingUrl = await prisma.siteUrl.findFirst({
        where: { siteId, url },
      });

      if (!existingUrl) {
        const newUrl = await prisma.siteUrl.create({
          data: {
            siteId,
            url,
            isActive: true,
          },
        });

        createdUrls.push(newUrl);

        // Queue crawl job for new URL
        await queueCrawl(siteId, 'single', url);
      }
    }

    res.status(201).json({ created: createdUrls.length });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/urls/{urlId}:
 *   patch:
 *     summary: Update URL settings
 *     description: Update URL settings like active or excluded status
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
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               isExcluded:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: URL updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 isExcluded:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site or URL not found
 */
router.put('/:urlId', authenticate, async (req, res, next) => {
  try {
    const { siteId, urlId } = req.params;
    const updates = updateUrlSchema.parse(req.body);

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

    // Update URL
    const updatedUrl = await prisma.siteUrl.update({
      where: { id: urlId },
      data: updates,
    });

    res.json(updatedUrl);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/urls/{urlId}:
 *   get:
 *     summary: Get single URL with content
 *     description: Get detailed information about a URL including its content
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
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     responses:
 *       200:
 *         description: URL details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *                 title:
 *                   type: string
 *                   nullable: true
 *                 content:
 *                   type: string
 *                   nullable: true
 *                 htmlContent:
 *                   type: string
 *                   nullable: true
 *                 isActive:
 *                   type: boolean
 *                 isExcluded:
 *                   type: boolean
 *                 lastCrawledAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 embeddingsCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site or URL not found
 */
router.get('/:urlId', authenticate, async (req, res, next) => {
  try {
    const { siteId, urlId } = req.params;

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

    // Get URL with content
    const siteUrl = await prisma.siteUrl.findUnique({
      where: { id: urlId },
      select: {
        id: true,
        url: true,
        title: true,
        content: true,
        htmlContent: true,
        isActive: true,
        isExcluded: true,
        lastCrawledAt: true,
        _count: {
          select: {
            embeddings: true,
          },
        },
      },
    });

    if (!siteUrl || siteUrl.id !== urlId) {
      throw new AppError(404, 'URL not found');
    }

    // Verify URL belongs to this site
    const urlBelongsToSite = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
    });

    if (!urlBelongsToSite) {
      throw new AppError(404, 'URL not found');
    }

    res.json({
      id: siteUrl.id,
      url: siteUrl.url,
      title: siteUrl.title,
      content: siteUrl.content,
      htmlContent: siteUrl.htmlContent,
      isActive: siteUrl.isActive,
      isExcluded: siteUrl.isExcluded,
      lastCrawledAt: siteUrl.lastCrawledAt,
      embeddingsCount: siteUrl._count.embeddings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/urls/{urlId}/content:
 *   put:
 *     summary: Update URL content
 *     description: Update the content of a URL and regenerate embeddings
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
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *                 title:
 *                   type: string
 *                   nullable: true
 *                 content:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 isExcluded:
 *                   type: boolean
 *                 lastCrawledAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 embeddingsCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site or URL not found
 */
router.put('/:urlId/content', authenticate, async (req, res, next) => {
  try {
    const { siteId, urlId } = req.params;
    const { content } = updateContentSchema.parse(req.body);

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

    // Verify URL exists and belongs to this site
    const existingUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
    });

    if (!existingUrl) {
      throw new AppError(404, 'URL not found');
    }

    // Calculate new content hash
    const contentHash = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');

    // Update content
    const updatedUrl = await prisma.siteUrl.update({
      where: { id: urlId },
      data: {
        content,
        contentHash,
      },
    });

    // Delete old embeddings and regenerate
    await prisma.embedding.deleteMany({
      where: { siteUrlId: urlId },
    });

    await generateEmbeddings(urlId, content);

    // Get updated embedding count
    const embeddingsCount = await prisma.embedding.count({
      where: { siteUrlId: urlId },
    });

    res.json({
      id: updatedUrl.id,
      url: updatedUrl.url,
      title: updatedUrl.title,
      content: updatedUrl.content,
      isActive: updatedUrl.isActive,
      isExcluded: updatedUrl.isExcluded,
      lastCrawledAt: updatedUrl.lastCrawledAt,
      embeddingsCount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/urls/{urlId}/crawl:
 *   post:
 *     summary: Recrawl specific URL
 *     description: Queue a recrawl job for a specific URL
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
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     responses:
 *       200:
 *         description: Recrawl initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site or URL not found
 */
router.post('/:urlId/crawl', authenticate, async (req, res, next) => {
  try {
    const { siteId, urlId } = req.params;

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

    // Get URL details
    const siteUrl = await prisma.siteUrl.findUnique({
      where: { id: urlId },
    });

    if (!siteUrl) {
      throw new AppError(404, 'URL not found');
    }

    // Queue recrawl
    await queueCrawl(siteId, 'single', siteUrl.url);

    res.json({ message: 'Recrawl initiated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/urls/{urlId}:
 *   delete:
 *     summary: Delete URL completely
 *     description: Delete a URL and all its associated data
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
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: URL ID
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Site or URL not found
 */
router.delete('/:urlId', authenticate, async (req, res, next) => {
  try {
    const { siteId, urlId } = req.params;

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

    // Verify URL exists and belongs to this site
    const siteUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
      include: {
        embeddings: {
          select: { vectorId: true },
        },
      },
    });

    if (!siteUrl) {
      throw new AppError(404, 'URL not found');
    }

    // Delete vectors from Pinecone if they exist
    if (siteUrl.embeddings.length > 0 && pinecone && PINECONE_INDEX_NAME) {
      try {
        const index = pinecone.Index(PINECONE_INDEX_NAME);
        const vectorIds = siteUrl.embeddings
          .map(e => e.vectorId)
          .filter((id): id is string => id !== null);

        if (vectorIds.length > 0) {
          await index.deleteMany(vectorIds);
        }
      } catch (pineconeError) {
        // Log but don't fail the deletion if Pinecone cleanup fails
        console.error('Failed to delete vectors from Pinecone:', pineconeError);
      }
    }

    // Delete URL (embeddings will cascade delete due to Prisma schema)
    await prisma.siteUrl.delete({
      where: { id: urlId },
    });

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;