/**
 * Conversation Routes
 * Route handlers using service layer and asyncHandler
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateQuery, validateParams, validateBody } from '../middleware/validate';
import { conversationService } from '../services/conversation/ConversationService';
import { conversationHandoffService } from '../services/conversation/ConversationHandoffService';
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
 *                       siteId:
 *                         type: string
 *                       sessionId:
 *                         type: string
 *                       userIdentifier:
 *                         type: string
 *                         nullable: true
 *                       userAgent:
 *                         type: string
 *                         nullable: true
 *                       ipAddress:
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
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED]
 *                       escalatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       escalationReason:
 *                         type: string
 *                         nullable: true
 *                       assignedAgentId:
 *                         type: string
 *                         nullable: true
 *                       agentJoinedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       resolvedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       agentNotes:
 *                         type: string
 *                         nullable: true
 *                       site:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           siteName:
 *                             type: string
 *                           siteUrl:
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
 *                     totalPages:
 *                       type: integer
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

// ============================================
// HUMAN HANDOFF ROUTES (Queue routes must come before :conversationId)
// ============================================

/**
 * @swagger
 * /api/v1/conversations/queue:
 *   get:
 *     summary: Get queue of conversations waiting for agents
 *     description: Retrieve conversations that need human agent intervention
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   siteId:
 *                     type: string
 *                   sessionId:
 *                     type: string
 *                   userIdentifier:
 *                     type: string
 *                     nullable: true
 *                   userAgent:
 *                     type: string
 *                     nullable: true
 *                   ipAddress:
 *                     type: string
 *                     nullable: true
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   lastMessageAt:
 *                     type: string
 *                     format: date-time
 *                   messageCount:
 *                     type: integer
 *                   status:
 *                     type: string
 *                     enum: [ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED]
 *                   escalatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   escalationReason:
 *                     type: string
 *                     nullable: true
 *                   assignedAgentId:
 *                     type: string
 *                     nullable: true
 *                   agentJoinedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   resolvedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   agentNotes:
 *                     type: string
 *                     nullable: true
 *                   site:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       siteName:
 *                         type: string
 *                       siteUrl:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/queue',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const queue = await conversationHandoffService.getQueue(req.user!.id);
    res.json(queue);
  })
);

/**
 * @swagger
 * /api/v1/conversations/queue/count:
 *   get:
 *     summary: Get count of conversations in queue
 *     description: Get the number of conversations waiting for agents
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/queue/count',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const count = await conversationHandoffService.getQueueCount(req.user!.id);
    res.json({ count });
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 siteId:
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
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED]
 *                 escalatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 escalationReason:
 *                   type: string
 *                   nullable: true
 *                 assignedAgentId:
 *                   type: string
 *                   nullable: true
 *                 agentJoinedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 resolvedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 agentNotes:
 *                   type: string
 *                   nullable: true
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
 *                       conversationId:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [USER, ASSISTANT, AGENT]
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       tokensUsed:
 *                         type: integer
 *                         nullable: true
 *                       costInCents:
 *                         type: integer
 *                         nullable: true
 *                       agentId:
 *                         type: string
 *                         nullable: true
 *                 assignedAgent:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                       nullable: true
 *                     email:
 *                       type: string
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

// Escalation and agent action routes

const escalateSchema = z.object({
  reason: z.string().optional(),
});

const agentMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
});

const resolveSchema = z.object({
  notes: z.string().optional(),
});

const updateNotesSchema = z.object({
  notes: z.string(),
});

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/escalate:
 *   post:
 *     summary: Escalate conversation to human agent
 *     description: Request human agent intervention for a conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation escalated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED]
 *                 escalatedAt:
 *                   type: string
 *                   format: date-time
 *                 escalationReason:
 *                   type: string
 *                   nullable: true
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:conversationId/escalate',
  authenticate,
  validateParams(conversationIdSchema),
  validateBody(escalateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await conversationHandoffService.escalateConversation(
      req.params.conversationId,
      req.body.reason
    );
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/take:
 *   post:
 *     summary: Agent takes a conversation
 *     description: Assign an agent to an escalated conversation
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
 *         description: Conversation taken successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED]
 *                 assignedAgentId:
 *                   type: string
 *                 agentJoinedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:conversationId/take',
  authenticate,
  validateParams(conversationIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await conversationHandoffService.takeConversation(
      req.params.conversationId,
      req.user!.id
    );
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/agent-message:
 *   post:
 *     summary: Send a message as an agent
 *     description: Agent sends a message in the conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 conversationId:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [USER, ASSISTANT, AGENT]
 *                 content:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 tokensUsed:
 *                   type: integer
 *                   nullable: true
 *                 costInCents:
 *                   type: integer
 *                   nullable: true
 *                 agentId:
 *                   type: string
 *                   nullable: true
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:conversationId/agent-message',
  authenticate,
  validateParams(conversationIdSchema),
  validateBody(agentMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const message = await conversationHandoffService.sendAgentMessage(
      req.params.conversationId,
      req.user!.id,
      req.body.content
    );
    res.json(message);
  })
);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/resolve:
 *   post:
 *     summary: Mark conversation as resolved
 *     description: Agent marks a conversation as resolved/closed
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, NEEDS_AGENT, AGENT_ACTIVE, RESOLVED]
 *                 resolvedAt:
 *                   type: string
 *                   format: date-time
 *                 agentNotes:
 *                   type: string
 *                   nullable: true
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:conversationId/resolve',
  authenticate,
  validateParams(conversationIdSchema),
  validateBody(resolveSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await conversationHandoffService.resolveConversation(
      req.params.conversationId,
      req.user!.id,
      req.body.notes
    );
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/notes:
 *   patch:
 *     summary: Update agent notes
 *     description: Update private agent notes for a conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notes updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 agentNotes:
 *                   type: string
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch(
  '/:conversationId/notes',
  authenticate,
  validateParams(conversationIdSchema),
  validateBody(updateNotesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await conversationHandoffService.updateAgentNotes(
      req.params.conversationId,
      req.user!.id,
      req.body.notes
    );
    res.json(result);
  })
);

export default router;
