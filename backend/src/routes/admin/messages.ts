/**
 * Admin Messages Routes
 * Route handlers for admin message management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminMessageService } from '../../services/admin';
import { ConversationRole } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/messages:
 *   get:
 *     summary: Get paginated list of messages
 *     tags: [Admin - Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      conversationId,
      siteId,
      role,
      dateFrom,
      dateTo,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminMessageService.getMessages({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      conversationId: conversationId as string | undefined,
      siteId: siteId as string | undefined,
      role: role as ConversationRole | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      sortBy: 'timestamp',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Admin - Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await adminMessageService.getMessageStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/messages/{messageId}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Admin - Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:messageId',
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await adminMessageService.getMessageById(messageId);
    res.json({ data: message });
  })
);

/**
 * @swagger
 * /api/v1/admin/messages/{messageId}:
 *   delete:
 *     summary: Delete message
 *     tags: [Admin - Messages]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:messageId',
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const result = await adminMessageService.deleteMessage(messageId);
    res.json(result);
  })
);

export default router;
