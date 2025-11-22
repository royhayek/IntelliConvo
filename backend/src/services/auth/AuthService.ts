/**
 * Auth Service
 * Business logic for authentication, OAuth, and token management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { generateTokens } from '../../middleware/auth';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
  NotFoundError,
} from '../../middleware/errors';
import { tokenBlacklist, TokenBlacklistService } from '../tokenBlacklist';
import { AuthProvider } from '@prisma/client';
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        authProvider: AuthProvider.EMAIL,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(refreshToken, user.id);

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

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
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

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
    });

    if (!user) {
      throw new NotFoundError('User', storedToken.userId);
    }

    // REFRESH TOKEN ROTATION for security
    // 1. Blacklist the old refresh token to prevent reuse
    await this.blacklistToken(refreshToken, 'token_rotation');

    // 2. Generate new tokens (both access and refresh)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
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
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
