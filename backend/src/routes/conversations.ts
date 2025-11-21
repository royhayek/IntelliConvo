/**
 * Conversation Routes
 * Route handlers using service layer and asyncHandler
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateQuery, validateParams } from '../middleware/validate';
import { conversationService } from '../services/conversation/ConversationService';
import { conversationQuerySchema, messageSearchSchema } from '../schemas';
import { z } from 'zod';

const router = Router();

// Schema for conversation ID parameter
const conversationIdSchema = z.object({
  conversationId: z.string().uuid(),
});

/**
 * @swagger
 * /api/v1/conversations:
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authenticate,
  validateQuery(conversationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const conversations = await conversationService.getConversations(
      req.user!.id,
      req.query
    );
    res.json(conversations);
  })
);

/**
 * @swagger
 * /api/v1/conversations/analytics:
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
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/analytics',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId, period } = req.query;
    const analytics = await conversationService.getAnalytics(
      req.user!.id,
      siteId as string | undefined,
      period as string | undefined
    );
    res.json(analytics);
  })
);

/**
 * @swagger
 * /api/v1/conversations/search:
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
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/search',
  authenticate,
  validateQuery(messageSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const results = await conversationService.searchMessages(
      req.user!.id,
      req.query as any
    );
    res.json(results);
  })
);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}:
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
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:conversationId',
  authenticate,
  validateParams(conversationIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const details = await conversationService.getConversationDetails(
      req.params.conversationId,
      req.user!.id
    );
    res.json(details);
  })
);

export default router;
