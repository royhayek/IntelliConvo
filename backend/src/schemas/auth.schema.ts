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

// Verify email schema
export const verifyEmailSchema = registry.register(
  'VerifyEmailRequest',
  z.object({
    token: z.string().min(1, 'Token is required').openapi({
      description: 'Email verification token from email',
      example: '1c2c6d7a0979e55da135e08bf5d4e719007b4d0cea9596b24f10e57664cc7732',
    }),
  }).openapi({
    description: 'Email verification request',
  })
);

// Resend verification email schema
export const resendVerificationSchema = registry.register(
  'ResendVerificationRequest',
  z.object({
    email: z.string().email('Invalid email address').openapi({
      description: 'Email address to resend verification',
      example: 'user@example.com',
    }),
  }).openapi({
    description: 'Resend verification email request',
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
      isAdmin: z.boolean().openapi({ description: 'Whether the user is an admin' }),
      emailVerified: z.boolean().openapi({ description: 'Whether the user email is verified' }),
    }).openapi({
      description: 'User information',
    }),
  }).openapi({
    description: 'Authentication tokens and user information',
  })
);

// Message response schema
export const authMessageResponseSchema = registry.register(
  'AuthMessageResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
  }).openapi({
    description: 'Simple message response',
  })
);

// Current user schema
export const currentUserSchema = registry.register(
  'CurrentUserResponse',
  z.object({
    id: z.string().uuid().openapi({ description: 'User ID' }),
    email: z.string().email().openapi({ description: 'User email' }),
    fullName: z.string().nullable().openapi({ description: 'User full name' }),
    isAdmin: z.boolean().openapi({ description: 'Whether the user is an admin' }),
    emailVerified: z.boolean().openapi({ description: 'Whether the user email is verified' }),
  }).openapi({
    description: 'Current user profile',
  })
);

// ============================================
// Path Registrations
// ============================================

// POST /api/v1/auth/signup
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup',
  summary: 'Register a new user',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: authTokensSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    409: {
      description: 'Email already exists',
    },
  },
});

// POST /api/v1/auth/login
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'User login',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: authTokensSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
    },
  },
});

// GET /api/v1/auth/google
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google',
  summary: 'Initiate Google OAuth login',
  tags: ['Authentication'],
  responses: {
    302: {
      description: 'Redirect to Google OAuth',
    },
  },
});

// GET /api/v1/auth/google/callback
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/google/callback',
  summary: 'Google OAuth callback',
  tags: ['Authentication'],
  request: {
    query: z.object({
      code: z.string().optional().openapi({ description: 'OAuth code' }),
      state: z.string().optional().openapi({ description: 'OAuth state' }),
    }),
  },
  responses: {
    302: {
      description: 'Redirect to frontend with tokens',
    },
    401: {
      description: 'OAuth authentication failed',
    },
  },
});

// GET /api/v1/auth/github
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/github',
  summary: 'Initiate GitHub OAuth login',
  tags: ['Authentication'],
  responses: {
    302: {
      description: 'Redirect to GitHub OAuth',
    },
  },
});

// GET /api/v1/auth/github/callback
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/github/callback',
  summary: 'GitHub OAuth callback',
  tags: ['Authentication'],
  request: {
    query: z.object({
      code: z.string().optional().openapi({ description: 'OAuth code' }),
      state: z.string().optional().openapi({ description: 'OAuth state' }),
    }),
  },
  responses: {
    302: {
      description: 'Redirect to frontend with tokens',
    },
    401: {
      description: 'OAuth authentication failed',
    },
  },
});

// POST /api/v1/auth/refresh
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  summary: 'Refresh access token',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: refreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string().openapi({ description: 'New access token' }),
            refreshToken: z.string().openapi({ description: 'New refresh token' }),
          }),
        },
      },
    },
    401: {
      description: 'Invalid refresh token',
    },
  },
});

// POST /api/v1/auth/logout
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  summary: 'User logout',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: logoutSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged out successfully',
      content: {
        'application/json': {
          schema: authMessageResponseSchema,
        },
      },
    },
  },
});

// GET /api/v1/auth/me
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  summary: 'Get current user profile',
  tags: ['Authentication'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile',
      content: {
        'application/json': {
          schema: currentUserSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// POST /api/v1/auth/forgot-password
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/forgot-password',
  summary: 'Request password reset email',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: requestPasswordResetSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset email sent (if account exists)',
      content: {
        'application/json': {
          schema: authMessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid email format',
    },
  },
});

// POST /api/v1/auth/reset-password
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/reset-password',
  summary: 'Reset password with token',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successfully',
      content: {
        'application/json': {
          schema: authMessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid or expired token',
    },
  },
});

// POST /api/v1/auth/verify-email
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/verify-email',
  summary: 'Verify email with token',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyEmailSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Email verified successfully',
      content: {
        'application/json': {
          schema: authMessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid or expired token',
    },
  },
});

// POST /api/v1/auth/resend-verification
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/resend-verification',
  summary: 'Resend verification email',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: resendVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification email sent',
      content: {
        'application/json': {
          schema: authMessageResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid email',
    },
  },
});

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
