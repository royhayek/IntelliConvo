import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const conversationQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  siteId: z.string().optional(),
});

const messageSearchSchema = z.object({
  query: z.string().min(1),
  siteId: z.string().optional(),
  limit: z.string().transform(Number).optional(),
});

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get conversations with filtering and pagination
 *     description: Retrieve conversations with advanced filtering, search, and pagination
 *     tags: [Conversations]
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
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in conversation messages
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter conversations from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter conversations until this date
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Filter by specific site
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       sessionId:
 *                         type: string
 *                       userIdentifier:
 *                         type: string
 *                         nullable: true
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                       lastMessageAt:
 *                         type: string
 *                         format: date-time
 *                       messageCount:
 *                         type: integer
 *                       site:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           siteName:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      startDate,
      endDate,
      siteId,
    } = conversationQuerySchema.parse(req.query);

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(100, Math.max(1, limit));
    const offset = (pageNumber - 1) * limitNumber;

    // Build base where clause
    const where: any = {
      site: {
        userId: req.user!.id,
      },
    };

    if (siteId) {
      // Verify user owns the specific site
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: req.user!.id },
      });

      if (!site) {
        throw new AppError(404, 'Site not found');
      }

      where.siteId = siteId;
    }

    // Date filtering
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.startedAt.lte = end;
      }
    }

    // Message content search
    if (search) {
      where.messages = {
        some: {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      };
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: offset,
        take: limitNumber,
      }),
      prisma.conversation.count({ where }),
    ]);

    res.json({
      conversations: conversations.map(conv => ({
        ...conv,
        messageCount: conv._count.messages,
        _count: undefined,
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/conversations/analytics:
 *   get:
 *     summary: Get conversation analytics
 *     description: Get analytics and statistics about conversations
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Filter analytics by specific site
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalConversations:
 *                       type: integer
 *                     totalMessages:
 *                       type: integer
 *                     averageMessagesPerConversation:
 *                       type: number
 *                     activeUsers:
 *                       type: integer
 *                 timeSeriesData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       conversations:
 *                         type: integer
 *                       messages:
 *                         type: integer
 *                 topSites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       siteId:
 *                         type: string
 *                       siteName:
 *                         type: string
 *                       conversationCount:
 *                         type: integer
 *                       messageCount:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/analytics', authenticate, async (req, res, next) => {
  try {
    const { siteId, period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const baseWhere: any = {
      site: { userId: req.user!.id },
      startedAt: { gte: startDate, lte: endDate },
    };

    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId as string, userId: req.user!.id },
      });
      if (!site) {
        throw new AppError(404, 'Site not found');
      }
      baseWhere.siteId = siteId;
    }

    // Get overview statistics
    const [conversationStats, messageStats] = await Promise.all([
      prisma.conversation.aggregate({
        where: baseWhere,
        _count: { id: true },
        _avg: { messageCount: true },
      }),
      prisma.message.aggregate({
        where: {
          conversation: baseWhere,
        },
        _count: { id: true },
      }),
    ]);

    // Get unique users count
    const uniqueUsers = await prisma.conversation.findMany({
      where: {
        ...baseWhere,
        userIdentifier: { not: null },
      },
      select: { userIdentifier: true },
      distinct: ['userIdentifier'],
    });

    // Get time series data (daily breakdown)
    const timeSeriesData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [dailyConversations, dailyMessages] = await Promise.all([
        prisma.conversation.count({
          where: {
            ...baseWhere,
            startedAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        prisma.message.count({
          where: {
            conversation: {
              ...baseWhere,
              startedAt: { gte: dayStart, lte: dayEnd },
            },
          },
        }),
      ]);

      timeSeriesData.push({
        date: dayStart.toISOString().split('T')[0],
        conversations: dailyConversations,
        messages: dailyMessages,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get top sites (if not filtering by specific site)
    let topSites = [];
    if (!siteId) {
      const sitesWithStats = await prisma.site.findMany({
        where: { userId: req.user!.id },
        include: {
          _count: {
            select: {
              conversations: {
                where: {
                  startedAt: { gte: startDate, lte: endDate },
                },
              },
            },
          },
        },
      });

      topSites = await Promise.all(
        sitesWithStats.map(async (site) => {
          const messageCount = await prisma.message.count({
            where: {
              conversation: {
                siteId: site.id,
                startedAt: { gte: startDate, lte: endDate },
              },
            },
          });

          return {
            siteId: site.id,
            siteName: site.siteName,
            conversationCount: site._count.conversations,
            messageCount,
          };
        })
      );

      topSites.sort((a, b) => b.conversationCount - a.conversationCount);
      topSites = topSites.slice(0, 5);
    }

    res.json({
      overview: {
        totalConversations: conversationStats._count.id,
        totalMessages: messageStats._count.id,
        averageMessagesPerConversation: conversationStats._avg.messageCount || 0,
        activeUsers: uniqueUsers.length,
      },
      timeSeriesData,
      topSites,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/conversations/search:
 *   get:
 *     summary: Search messages across conversations
 *     description: Search for specific content within conversation messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Filter search by specific site
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       role:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       conversation:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           sessionId:
 *                             type: string
 *                           site:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               siteName:
 *                                 type: string
 *                 total:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { query, siteId, limit = 20 } = messageSearchSchema.parse(req.query);

    const limitNumber = Math.min(100, Math.max(1, limit));

    const where: any = {
      content: {
        contains: query,
        mode: 'insensitive',
      },
      conversation: {
        site: {
          userId: req.user!.id,
        },
      },
    };

    if (siteId) {
      // Verify user owns the site
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: req.user!.id },
      });

      if (!site) {
        throw new AppError(404, 'Site not found');
      }

      where.conversation.siteId = siteId;
    }

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          conversation: {
            select: {
              id: true,
              sessionId: true,
              site: {
                select: {
                  id: true,
                  siteName: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limitNumber,
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      messages,
      total: totalCount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation details with messages
 *     description: Retrieve a specific conversation with all its messages
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 userIdentifier:
 *                   type: string
 *                   nullable: true
 *                 userAgent:
 *                   type: string
 *                   nullable: true
 *                 ipAddress:
 *                   type: string
 *                   nullable: true
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 lastMessageAt:
 *                   type: string
 *                   format: date-time
 *                 messageCount:
 *                   type: integer
 *                 site:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     siteName:
 *                       type: string
 *                     siteUrl:
 *                       type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       role:
 *                         type: string
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       tokensUsed:
 *                         type: integer
 *                         nullable: true
 *                       costInCents:
 *                         type: number
 *                         nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:conversationId', authenticate, async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            userId: true,
          },
        },
        messages: {
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            timestamp: true,
            tokensUsed: true,
            costInCents: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    // Verify user owns the site
    if (conversation.site.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    // Remove userId from site object before sending
    const { userId, ...siteInfo } = conversation.site;

    res.json({
      ...conversation,
      site: siteInfo,
    });
  } catch (error) {
    next(error);
  }
});

export default router;