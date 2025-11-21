import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Authentication & User Schemas
 * Centralized Zod validation schemas for auth-related endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Register schema
export const registerSchema = registry.register(
  'RegisterRequest',
  z.object({
    email: z.string().email('Invalid email address').openapi({
      description: 'User email address',
      example: 'user@example.com',
    }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .openapi({
        description: 'Password (min 8 characters, must include uppercase, lowercase, and number)',
        example: 'MyP@ssw0rd',
        minLength: 8,
      }),
    fullName: z.string().min(1, 'Full name is required').optional().openapi({
      description: 'User full name',
      example: 'John Doe',
    }),
  }).openapi({
    description: 'User registration request',
  })
);

// Login schema
export const loginSchema = registry.register(
  'LoginRequest',
  z.object({
    email: z.string().email('Invalid email address').openapi({
      description: 'User email address',
      example: 'user@example.com',
    }),
    password: z.string().min(1, 'Password is required').openapi({
      description: 'User password',
      example: 'MyP@ssw0rd',
    }),
  }).openapi({
    description: 'User login request',
  })
);

// Refresh token schema
export const refreshTokenSchema = registry.register(
  'RefreshTokenRequest',
  z.object({
    refreshToken: z.string().min(1, 'Refresh token is required').openapi({
      description: 'JWT refresh token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
  }).openapi({
    description: 'Token refresh request',
  })
);

// Password reset request schema
export const requestPasswordResetSchema = registry.register(
  'RequestPasswordResetRequest',
  z.object({
    email: z.string().email('Invalid email address').openapi({
      description: 'Email address to send reset link',
      example: 'user@example.com',
    }),
  }).openapi({
    description: 'Password reset request',
  })
);

// Password reset schema
export const resetPasswordSchema = registry.register(
  'ResetPasswordRequest',
  z.object({
    token: z.string().min(1, 'Reset token is required').openapi({
      description: 'Password reset token from email',
      example: 'abc123def456',
    }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .openapi({
        description: 'New password (min 8 characters, must include uppercase, lowercase, and number)',
        example: 'NewP@ssw0rd',
        minLength: 8,
      }),
  }).openapi({
    description: 'Password reset with token',
  })
);

// Change password schema
export const changePasswordSchema = registry.register(
  'ChangePasswordRequest',
  z.object({
    currentPassword: z.string().min(1, 'Current password is required').openapi({
      description: 'Current password',
      example: 'OldP@ssw0rd',
    }),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .openapi({
        description: 'New password (min 8 characters, must include uppercase, lowercase, and number)',
        example: 'NewP@ssw0rd',
        minLength: 8,
      }),
  }).openapi({
    description: 'Change password request',
  })
);

// Logout schema
export const logoutSchema = registry.register(
  'LogoutRequest',
  z.object({
    refreshToken: z.string().optional().openapi({
      description: 'Optional refresh token to invalidate',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
  }).openapi({
    description: 'Logout request',
  })
);

// Auth response schemas
export const authTokensSchema = registry.register(
  'AuthTokensResponse',
  z.object({
    accessToken: z.string().openapi({
      description: 'JWT access token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    refreshToken: z.string().openapi({
      description: 'JWT refresh token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    user: z.object({
      id: z.string().uuid().openapi({ description: 'User ID' }),
      email: z.string().email().openapi({ description: 'User email' }),
      fullName: z.string().nullable().openapi({ description: 'User full name' }),
      authProvider: z.string().openapi({ description: 'Authentication provider' }),
    }).openapi({
      description: 'User information',
    }),
  }).openapi({
    description: 'Authentication tokens and user information',
  })
);

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
