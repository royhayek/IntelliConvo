/**
 * Admin Sessions Routes
 * Route handlers for admin session (refresh token) management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminSessionService } from '../../services/admin';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/sessions:
 *   get:
 *     summary: Get paginated list of sessions
 *     tags: [Admin - Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      userId,
      expired,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminSessionService.getSessions({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      userId: userId as string | undefined,
      expired: expired === 'true' ? true : expired === 'false' ? false : undefined,
      sortBy: sortBy as 'createdAt' | 'expiresAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/sessions/stats:
 *   get:
 *     summary: Get session statistics
 *     tags: [Admin - Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await adminSessionService.getSessionStats();
    res.json({ data: stats });
  })
);

/**
 * @swagger
 * /api/v1/admin/sessions/user/{userId}:
 *   get:
 *     summary: Get sessions for a specific user
 *     tags: [Admin - Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await adminSessionService.getUserSessions(userId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/sessions/user/{userId}:
 *   delete:
 *     summary: Revoke all sessions for a user (force logout)
 *     tags: [Admin - Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await adminSessionService.revokeUserSessions(userId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Admin - Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:sessionId',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const result = await adminSessionService.revokeSession(sessionId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/sessions/cleanup:
 *   post:
 *     summary: Clean up expired sessions
 *     tags: [Admin - Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/cleanup',
  asyncHandler(async (req, res) => {
    const result = await adminSessionService.cleanupExpiredSessions();
    res.json(result);
  })
);

export default router;
