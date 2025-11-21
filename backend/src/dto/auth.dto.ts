/**
 * Authentication Data Transfer Objects (DTOs)
 * Type definitions for authentication-related API requests and responses
 */

import { AuthProvider } from '@prisma/client';

/**
 * User information (without sensitive data)
 */
export interface UserDTO {
  id: string;
  email: string;
  fullName: string | null;
  authProvider: AuthProvider;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/**
 * Authentication tokens
 */
export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
}

/**
 * Complete authentication response
 */
export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Signup/Register request
 */
export interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Register request (alias for SignupRequest)
 */
export type RegisterRequest = SignupRequest;

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Logout request
 */
export interface LogoutRequest {
  refreshToken?: string;
  accessToken?: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirm request
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * OAuth callback data
 */
export interface OAuthCallbackData {
  code: string;
  state?: string;
}

/**
 * OAuth callback response
 */
export interface OAuthCallbackResponse {
  accessToken: string;
  refreshToken: string;
  redirectUrl: string;
}
