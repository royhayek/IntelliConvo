import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const updateBillingInfoSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

const updateAccountSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/**
 * @swagger
 * /api/account:
 *   get:
 *     summary: Get current user account information
 *     description: Retrieve the authenticated user's account details
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                       nullable: true
 *                     authProvider:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                 billingInfo:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     addressLine1:
 *                       type: string
 *                     addressLine2:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     country:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSites:
 *                       type: integer
 *                     activeSubscriptions:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        billingInfo: true,
        _count: {
          select: {
            sites: true,
            subscriptions: {
              where: {
                status: { in: ['TRIAL', 'ACTIVE'] },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Remove sensitive data
    const { passwordHash, ...userInfo } = user;

    res.json({
      user: userInfo,
      billingInfo: user.billingInfo ? {
        fullName: user.billingInfo.fullName,
        email: user.billingInfo.email,
        addressLine1: user.billingInfo.addressLine1,
        addressLine2: user.billingInfo.addressLine2,
        city: user.billingInfo.city,
        state: user.billingInfo.state,
        country: user.billingInfo.country,
        postalCode: user.billingInfo.postalCode,
      } : null,
      stats: {
        totalSites: user._count.sites,
        activeSubscriptions: user._count.subscriptions,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/account:
 *   patch:
 *     summary: Update user account information
 *     description: Update the authenticated user's basic account details
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/', authenticate, async (req, res, next) => {
  try {
    const updates = updateAccountSchema.parse(req.body);

    // Check if email is being changed and if it's already taken
    if (updates.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updates.email,
          id: { not: req.user!.id },
        },
      });

      if (existingUser) {
        throw new AppError(409, 'Email address is already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    res.json({
      message: 'Account updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/account/billing-info:
 *   get:
 *     summary: Get billing information
 *     description: Retrieve the user's billing address and information
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 billingInfo:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     addressLine1:
 *                       type: string
 *                     addressLine2:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     country:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/billing-info', authenticate, async (req, res, next) => {
  try {
    const billingInfo = await prisma.billingInfo.findUnique({
      where: { userId: req.user!.id },
      select: {
        fullName: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
      },
    });

    res.json({ billingInfo });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/account/billing-info:
 *   put:
 *     summary: Update billing information
 *     description: Update the user's billing address and information
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - addressLine1
 *               - city
 *               - state
 *               - country
 *               - postalCode
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name for billing
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email for billing notifications
 *                 example: john.doe@example.com
 *               addressLine1:
 *                 type: string
 *                 description: Primary address line
 *                 example: 1234 Main Street
 *               addressLine2:
 *                 type: string
 *                 description: Secondary address line (optional)
 *                 example: Apt 101
 *               city:
 *                 type: string
 *                 description: City
 *                 example: San Francisco
 *               state:
 *                 type: string
 *                 description: State or province
 *                 example: California
 *               country:
 *                 type: string
 *                 description: Country
 *                 example: United States
 *               postalCode:
 *                 type: string
 *                 description: Postal or ZIP code
 *                 example: 94102
 *     responses:
 *       200:
 *         description: Billing information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Billing information updated successfully
 *                 billingInfo:
 *                   type: object
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     addressLine1:
 *                       type: string
 *                     addressLine2:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     country:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/billing-info', authenticate, async (req, res, next) => {
  try {
    const data = updateBillingInfoSchema.parse(req.body);

    const billingInfo = await prisma.billingInfo.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...data,
      },
      update: data,
      select: {
        fullName: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
      },
    });

    res.json({
      message: 'Billing information updated successfully',
      billingInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the user account and all associated data
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deletion initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       400:
 *         description: Cannot delete account with active subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Cannot delete account with active subscriptions
 *                 activeSubscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       siteId:
 *                         type: string
 *                       siteName:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/', authenticate, async (req, res, next) => {
  try {
    // Check for active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.user!.id,
        status: { in: ['TRIAL', 'ACTIVE'] },
      },
      include: {
        site: {
          select: { id: true, siteName: true },
        },
      },
    });

    if (activeSubscriptions.length > 0) {
      throw new AppError(400, 'Cannot delete account with active subscriptions', {
        activeSubscriptions: activeSubscriptions.map(sub => ({
          siteId: sub.siteId,
          siteName: sub.site.siteName,
          status: sub.status,
        })),
      });
    }

    // Delete user and all related data (cascading will handle most relationships)
    await prisma.user.delete({
      where: { id: req.user!.id },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/account/password:
 *   patch:
 *     summary: Change password
 *     description: Change the authenticated user's password
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(400, 'Cannot change password for this account');
    }

    // Verify current password
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new AppError(400, 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;