/**
 * Notification Routes
 * API endpoints for user notifications
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/notification/NotificationService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of notifications to return
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await notificationService.getUserNotifications(req.user!.id, limit);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ unreadCount: count });
  })
);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated notification
 */
router.patch(
  '/:notificationId/read',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(
      req.params.notificationId,
      req.user!.id
    );
    res.json(notification);
  })
);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.patch(
  '/read-all',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  })
);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete(
  '/:notificationId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await notificationService.deleteNotification(req.params.notificationId, req.user!.id);
    res.json({ message: 'Notification deleted' });
  })
);

export default router;
