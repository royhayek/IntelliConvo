/**
 * Admin Conversations Routes
 * Route handlers for admin conversation management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminConversationService } from '../../services/admin';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/conversations:
 *   get:
 *     summary: Get paginated list of conversations
 *     tags: [Admin - Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      siteId,
      search,
      dateFrom,
      dateTo,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminConversationService.getConversations({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      siteId: siteId as string | undefined,
      search: search as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      sortBy: sortBy as 'startedAt' | 'lastMessageAt' | 'messageCount',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation by ID with messages
 *     tags: [Admin - Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:conversationId',
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const conversation = await adminConversationService.getConversationById(conversationId);
    res.json({ data: conversation });
  })
);

/**
 * @swagger
 * /api/v1/admin/conversations/{conversationId}:
 *   delete:
 *     summary: Delete conversation
 *     tags: [Admin - Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:conversationId',
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const result = await adminConversationService.deleteConversation(conversationId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/conversations/site/{siteId}:
 *   delete:
 *     summary: Delete all conversations for a site
 *     tags: [Admin - Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/site/:siteId',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const result = await adminConversationService.deleteSiteConversations(siteId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/conversations/site/{siteId}/stats:
 *   get:
 *     summary: Get conversation statistics for a site
 *     tags: [Admin - Conversations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/site/:siteId/stats',
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const stats = await adminConversationService.getSiteConversationStats(siteId);
    res.json({ data: stats });
  })
);

export default router;
