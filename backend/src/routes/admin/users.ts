/**
 * Admin Users Routes
 * Route handlers for admin user management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

import { adminUserService } from '../../services/admin';
import { AuthProvider } from '@prisma/client';

const router = Router();

// ============================================
// User Management Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get paginated list of users
 *     description: Returns a paginated list of users with search and filter options
 *     tags: [Admin - Users]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *       - in: query
 *         name: authProvider
 *         schema:
 *           type: string
 *           enum: [EMAIL, GOOGLE, APPLE]
 *         description: Filter by auth provider
 *       - in: query
 *         name: isAdmin
 *         schema:
 *           type: boolean
 *         description: Filter by admin status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, lastLoginAt, email]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      search,
      authProvider,
      isAdmin,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminUserService.getUsers({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      authProvider: authProvider as AuthProvider | undefined,
      isAdmin: isAdmin === 'true' ? true : isAdmin === 'false' ? false : undefined,
      sortBy: sortBy as 'createdAt' | 'lastLoginAt' | 'email',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password, fullName, isAdmin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await adminUserService.createUser({
      email,
      password,
      fullName,
      isAdmin,
    });

    res.status(201).json({ data: user });
  })
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns detailed information about a specific user
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
/**
 * @swagger
 * /api/v1/admin/users/export:
 *   get:
 *     summary: Export users
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { format = 'json', search, authProvider, isAdmin } = req.query;

    const result = await adminUserService.exportUsers(
      format as 'csv' | 'json',
      {
        page: 1,
        limit: 10000,
        search: search as string | undefined,
        authProvider: authProvider as AuthProvider | undefined,
        isAdmin: isAdmin === 'true' ? true : isAdmin === 'false' ? false : undefined,
      }
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
      res.send(result.data);
    } else {
      res.json({ data: result });
    }
  })
);

router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await adminUserService.getUserById(userId);
    res.json({ data: user });
  })
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   patch:
 *     summary: Update user
 *     description: Update user information (fullName, email, isAdmin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { fullName, email, isAdmin } = req.body;

    const updatedUser = await adminUserService.updateUser(userId, {
      fullName,
      email,
      isAdmin,
    });

    res.json({ data: updatedUser });
  })
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user and all their associated data
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete(
  '/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await adminUserService.deleteUser(userId);
    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/force-logout:
 *   post:
 *     summary: Force logout user
 *     description: Invalidate all refresh tokens for a user, forcing them to re-authenticate
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User sessions revoked successfully
 *       404:
 *         description: User not found
 */
router.post(
  '/:userId/force-logout',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await adminUserService.forceLogout(userId);
    res.json({ data: result });
  })
);

export default router;
