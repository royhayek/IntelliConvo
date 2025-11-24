/**
 * Auth Routes
 * Route handlers using AuthService for business logic
 */

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { validateJsonContentType } from '../middleware/contentType';
import { createAuthRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import { messageResponse, errorResponse } from '../utils/response';
import { ForbiddenError } from '../middleware/errors';
import { authService } from '../services';
import { settings } from '../lib/settings';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../schemas';

/**
 * Middleware to check if an auth provider is enabled
 */
const checkProviderEnabled = (provider: string) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const isEnabled = await settings.isAuthProviderEnabled(provider);
    if (!isEnabled) {
      const error = new ForbiddenError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is disabled`);
      return res.status(403).json(errorResponse(error));
    }
    next();
  });
};

const router = Router();

// Create rate limiter at module initialization time (not during request handling)
const authLimiter = createAuthRateLimiter();

// ============================================
// Email/Password Authentication
// ============================================

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 */
router.post(
  '/signup',
  checkProviderEnabled('email'),
  authLimiter,
  validateJsonContentType,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 */
router.post(
  '/login',
  checkProviderEnabled('email'),
  authLimiter,
  validateJsonContentType,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  })
);

// ============================================
// OAuth Authentication
// ============================================

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 */
router.get(
  '/google',
  checkProviderEnabled('google'),
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 */
router.get(
  '/google/callback',
  checkProviderEnabled('google'),
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    const result = await authService.handleOAuthCallback(user);
    res.redirect(result.redirectUrl);
  })
);

/**
 * @swagger
 * /api/v1/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 */
router.get(
  '/github',
  checkProviderEnabled('github'),
  passport.authenticate('github', { scope: ['user:email'] })
);

/**
 * @swagger
 * /api/v1/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 */
router.get(
  '/github/callback',
  checkProviderEnabled('github'),
  passport.authenticate('github', { session: false }),
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    const result = await authService.handleOAuthCallback(user);
    res.redirect(result.redirectUrl);
  })
);

// ============================================
// Token Management
// ============================================

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 */
router.post(
  '/refresh',
  authLimiter,
  validateJsonContentType,
  validateBody(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 */
router.post(
  '/logout',
  validateJsonContentType,
  asyncHandler(async (req, res) => {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : undefined;

    await authService.logout({
      refreshToken: req.body.refreshToken,
      accessToken,
    });

    res.json(messageResponse('Logged out successfully'));
  })
);

// ============================================
// Current User
// ============================================

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      fullName: req.user!.fullName,
      isAdmin: req.user!.isAdmin,
      emailVerified: req.user!.emailVerified,
    });
  })
);

// ============================================
// Email Verification
// ============================================

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 */
router.post(
  '/verify-email',
  validateJsonContentType,
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    const result = await authService.verifyEmail(token);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 */
router.post(
  '/resend-verification',
  authLimiter,
  validateJsonContentType,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.resendVerificationEmail(email);
    res.json(result);
  })
);

// ============================================
// Password Reset
// ============================================

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateJsonContentType,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 */
router.post(
  '/reset-password',
  authLimiter,
  validateJsonContentType,
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const result = await authService.resetPassword(token, password);
    res.json(result);
  })
);

export default router;
