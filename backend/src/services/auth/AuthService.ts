/**
 * Auth Service
 * Business logic for authentication, OAuth, and token management
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { generateTokens } from '../../middleware/auth';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
  NotFoundError,
  AccountLockedError,
  BadRequestError,
} from '../../middleware/errors';
import { loginAttemptTracker } from '../loginAttemptTracker';
import { tokenBlacklist, TokenBlacklistService } from '../tokenBlacklist';
import { AuthProvider, NotificationType } from '@prisma/client';
import { settings } from '../../lib/settings';
import { queueWelcomeEmail, queueVerificationEmail, queuePasswordResetEmail } from '../../queues';
import { logger } from '../../utils/logger';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  OAuthCallbackResponse,
  UserDTO,
} from '../../dto/auth.dto';

/**
 * AuthService class
 * Handles all authentication-related business logic
 */
export class AuthService {
  /**
   * Register a new user with email and password
   * @param data - Registration data
   * @returns User info and tokens
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, fullName } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AlreadyExistsError('User', 'email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if email verification is required
    const requireVerification = await settings.isEmailVerificationEnabled();

    // Generate verification token if required
    let emailVerifyToken: string | undefined;
    let emailVerifyExpiresAt: Date | undefined;
    if (requireVerification) {
      emailVerifyToken = crypto.randomBytes(32).toString('hex');
      emailVerifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        authProvider: AuthProvider.EMAIL,
        emailVerified: !requireVerification, // Auto-verify if verification not required
        emailVerifyToken,
        emailVerifyExpiresAt,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(refreshToken, user.id);

    // Send welcome email (combined with verification link if needed)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = requireVerification && emailVerifyToken
      ? `${frontendUrl}/verify-email?token=${emailVerifyToken}`
      : undefined;

    queueWelcomeEmail(
      user.id,
      user.email,
      user.fullName || '',
      `${frontendUrl}/dashboard`,
      verificationUrl // Optional: includes verification link if needed
    ).catch(err => logger.error('Failed to queue welcome email', { error: err, userId: user.id }));

    // Create welcome in-app notification
    const welcomeMessage = requireVerification
      ? `Welcome to IntelligentConvo! Please check your email to verify your account and get full access.`
      : `Welcome to IntelligentConvo! You're all set to create your first AI assistant.`;

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.INFO,
        title: 'Welcome!',
        message: welcomeMessage,
        link: '/dashboard',
      },
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user: this.mapUserToDTO(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   * @param data - Login credentials
   * @returns User info and tokens
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Check if account is locked out due to too many failed attempts
    const lockoutStatus = await loginAttemptTracker.isLockedOut(email);
    if (lockoutStatus.locked) {
      throw new AccountLockedError(lockoutStatus.retryAfter!);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // Record failed attempt even for non-existent users (prevent user enumeration)
      await loginAttemptTracker.recordFailedAttempt(email);
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Record failed attempt
      const attemptResult = await loginAttemptTracker.recordFailedAttempt(email);

      // If this attempt triggered a lockout, throw lockout error
      if (attemptResult.locked) {
        throw new AccountLockedError(attemptResult.retryAfter!);
      }

      throw new InvalidCredentialsError();
    }

    // Successful login - reset failed attempts
    await loginAttemptTracker.resetAttempts(email);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(refreshToken, user.id);

    return {
      user: this.mapUserToDTO(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Handle OAuth callback (Google, GitHub, etc.)
   * @param user - User object from OAuth provider
   * @returns Tokens and redirect URL
   */
  async handleOAuthCallback(user: any): Promise<OAuthCallbackResponse> {
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(refreshToken, user.id);

    // Build redirect URL
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;

    return {
      accessToken,
      refreshToken,
      redirectUrl,
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation for security
   * @param data - Refresh token data
   * @returns New access and refresh tokens
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = data;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    // Check if refresh token is blacklisted (token rotation security)
    const isBlacklisted = await tokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: {
        id: true,
        email: true,
        forceLogoutAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', storedToken.userId);
    }

    // Check if user was force logged out after this refresh token was created
    if (user.forceLogoutAt && storedToken.createdAt < user.forceLogoutAt) {
      throw new UnauthorizedError('Session has been revoked. Please log in again.');
    }

    // REFRESH TOKEN ROTATION for security
    // 1. Blacklist the old refresh token to prevent reuse
    await this.blacklistToken(refreshToken, 'token_rotation');

    // 2. Generate new tokens (both access and refresh)
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user.id,
      user.email
    );

    // 3. Delete old refresh token from database
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // 4. Store new refresh token in database
    await this.storeRefreshToken(newRefreshToken, user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by invalidating tokens
   * @param data - Logout data with tokens
   */
  async logout(data: LogoutRequest): Promise<void> {
    const { refreshToken, accessToken } = data;

    // Blacklist access token if provided
    if (accessToken) {
      await this.blacklistToken(accessToken, 'user_logout');
    }

    // Blacklist and remove refresh token from database
    if (refreshToken) {
      // Add to blacklist
      await this.blacklistToken(refreshToken, 'user_logout');

      // Remove from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User DTO
   */
  async getUserById(userId: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return this.mapUserToDTO(user);
  }

  // ============================================
  // Email Verification Methods
  // ============================================

  /**
   * Verify user email with token
   * @param token - Verification token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestError('Invalid verification token');
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }

    if (user.emailVerifyExpiresAt && user.emailVerifyExpiresAt < new Date()) {
      throw new BadRequestError('Verification token has expired. Please request a new one.');
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    logger.info('Email verified successfully', { userId: user.id });
    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   * @param email - User email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { success: true, message: 'If your email is registered, you will receive a verification email.' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified.' };
    }

    // Generate new verification token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpiresAt,
      },
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${emailVerifyToken}`;
    await queueVerificationEmail(
      user.id,
      user.email,
      user.fullName || '',
      verificationUrl,
      24
    );

    logger.info('Verification email resent', { userId: user.id });
    return { success: true, message: 'Verification email sent.' };
  }

  // ============================================
  // Password Reset Methods
  // ============================================

  /**
   * Request password reset (forgot password)
   * @param email - User email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    const successMessage = 'If your email is registered, you will receive a password reset link.';

    if (!user) {
      return { success: true, message: successMessage };
    }

    // Only allow password reset for email-based accounts
    if (user.authProvider !== AuthProvider.EMAIL) {
      return { success: true, message: successMessage };
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });

    // Send password reset email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${passwordResetToken}`;
    await queuePasswordResetEmail(
      user.id,
      user.email,
      user.fullName || '',
      resetUrl,
      60 // expires in 60 minutes
    );

    logger.info('Password reset requested', { userId: user.id });
    return { success: true, message: successMessage };
  }

  /**
   * Reset password with token
   * @param token - Password reset token
   * @param newPassword - New password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestError('Reset token has expired. Please request a new one.');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // Invalidate all existing sessions (force re-login)
    await prisma.user.update({
      where: { id: user.id },
      data: { forceLogoutAt: new Date() },
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    logger.info('Password reset successfully', { userId: user.id });
    return { success: true, message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Store refresh token in database
   * @param refreshToken - JWT refresh token
   * @param userId - User ID
   */
  private async storeRefreshToken(
    refreshToken: string,
    userId: string
  ): Promise<void> {
    // Get refresh token expiration from settings
    const refreshTokenDays = await settings.getRefreshTokenDays();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  /**
   * Blacklist a token (access or refresh)
   * @param token - JWT token to blacklist
   * @param reason - Reason for blacklisting
   */
  private async blacklistToken(
    token: string,
    reason: 'token_rotation' | 'user_logout'
  ): Promise<void> {
    try {
      // Decode to get expiration time
      const decoded = jwt.decode(token) as any;
      const ttl = TokenBlacklistService.calculateTTL(decoded?.exp);

      // Add to blacklist
      await tokenBlacklist.blacklistToken(token, ttl, reason);
    } catch (error) {
      // If token is invalid, that's fine - no need to blacklist
      // Log the error but don't throw
      console.error('Failed to blacklist token:', error);
    }
  }

  /**
   * Map User entity to UserDTO
   * @param user - Prisma user object
   * @returns UserDTO
   */
  private mapUserToDTO(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      authProvider: user.authProvider,
      isAdmin: user.isAdmin || false,
      emailVerified: user.emailVerified ?? true,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
