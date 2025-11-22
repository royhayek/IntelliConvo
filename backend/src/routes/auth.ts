/**
 * Auth Routes
 * Route handlers using AuthService for business logic
 */

import { Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { validateJsonContentType } from '../middleware/contentType';
import { createAuthRateLimiter } from '../middleware/rateLimiter';
import { messageResponse } from '../utils/response';
import { authService } from '../services';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../schemas';

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

export default router;
