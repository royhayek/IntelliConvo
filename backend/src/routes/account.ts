/**
 * Account Routes
 * Route handlers for user account management
 */

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { messageResponse } from '../utils/response';
import { AppError, NotFoundError, ErrorCode } from '../middleware/errors';

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

// ============================================
// Account Management
// ============================================

/**
 * @swagger
 * /api/v1/account:
 *   get:
 *     summary: Get current user account information
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
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
      throw new NotFoundError('User', req.user!.id);
    }

    // Remove sensitive data
    const { passwordHash, ...userInfo } = user;

    res.json({
      user: userInfo,
      billingInfo: user.billingInfo
        ? {
            fullName: user.billingInfo.fullName,
            email: user.billingInfo.email,
            addressLine1: user.billingInfo.addressLine1,
            addressLine2: user.billingInfo.addressLine2,
            city: user.billingInfo.city,
            state: user.billingInfo.state,
            country: user.billingInfo.country,
            postalCode: user.billingInfo.postalCode,
          }
        : null,
      stats: {
        totalSites: user._count.sites,
        activeSubscriptions: user._count.subscriptions,
      },
    });
  })
);

/**
 * @swagger
 * /api/v1/account:
 *   patch:
 *     summary: Update user account information
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/',
  authenticate,
  validateBody(updateAccountSchema),
  asyncHandler(async (req, res) => {
    const updates = req.body;

    // Check if email is being changed and if it's already taken
    if (updates.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updates.email,
          id: { not: req.user!.id },
        },
      });

      if (existingUser) {
        throw new AppError(
          409,
          ErrorCode.CONFLICT,
          'Email address is already in use'
        );
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

    res.json({ user: updatedUser });
  })
);

/**
 * @swagger
 * /api/v1/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
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
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Cannot delete account with active subscriptions',
        true,
        {
          activeSubscriptions: activeSubscriptions.map((sub) => ({
            siteId: sub.siteId,
            siteName: sub.site.siteName,
            status: sub.status,
          })),
        }
      );
    }

    // Delete user and all related data (cascading will handle most relationships)
    await prisma.user.delete({
      where: { id: req.user!.id },
    });

    res.json(messageResponse('Account deleted successfully'));
  })
);

// ============================================
// Billing Information
// ============================================

/**
 * @swagger
 * /api/v1/account/billing-info:
 *   get:
 *     summary: Get billing information
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/billing-info',
  authenticate,
  asyncHandler(async (req, res) => {
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
  })
);

/**
 * @swagger
 * /api/v1/account/billing-info:
 *   put:
 *     summary: Update billing information
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/billing-info',
  authenticate,
  validateBody(updateBillingInfoSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;

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

    res.json({ billingInfo });
  })
);

// ============================================
// Password Management
// ============================================

/**
 * @swagger
 * /api/v1/account/password:
 *   patch:
 *     summary: Change password
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Cannot change password for this account'
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Current password is incorrect'
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newPasswordHash },
    });

    res.json(messageResponse('Password changed successfully'));
  })
);

export default router;
