import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Account Schemas
 * Centralized Zod validation schemas for account management endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Request Schemas
// ============================================

// Update account schema
export const updateAccountSchema = registry.register(
  'UpdateAccountRequest',
  z.object({
    fullName: z.string().min(1).optional().openapi({
      description: 'User full name',
      example: 'John Doe',
    }),
    email: z.string().email().optional().openapi({
      description: 'User email address',
      example: 'john@example.com',
    }),
  }).openapi({
    description: 'Update account information',
  })
);

// Change password schema
export const changePasswordSchema = registry.register(
  'ChangePasswordRequest',
  z.object({
    currentPassword: z.string().min(1).openapi({
      description: 'Current password',
      example: 'OldPassword123',
    }),
    newPassword: z.string().min(8).openapi({
      description: 'New password (min 8 characters)',
      example: 'NewPassword123',
    }),
  }).openapi({
    description: 'Change password request',
  })
);

// Update billing info schema
export const updateBillingInfoSchema = registry.register(
  'UpdateBillingInfoRequest',
  z.object({
    fullName: z.string().min(1).openapi({
      description: 'Full name for billing',
      example: 'John Doe',
    }),
    email: z.string().email().openapi({
      description: 'Billing email',
      example: 'john@example.com',
    }),
    addressLine1: z.string().min(1).openapi({
      description: 'Address line 1',
      example: '123 Main St',
    }),
    addressLine2: z.string().optional().openapi({
      description: 'Address line 2',
      example: 'Suite 100',
    }),
    city: z.string().min(1).openapi({
      description: 'City',
      example: 'San Francisco',
    }),
    state: z.string().min(1).openapi({
      description: 'State/Province',
      example: 'CA',
    }),
    country: z.string().min(1).openapi({
      description: 'Country',
      example: 'US',
    }),
    postalCode: z.string().min(1).openapi({
      description: 'Postal code',
      example: '94102',
    }),
  }).openapi({
    description: 'Update billing information',
  })
);

// ============================================
// Response Schemas
// ============================================

// User info schema
export const userInfoSchema = registry.register(
  'UserInfo',
  z.object({
    id: z.string().uuid().openapi({ description: 'User ID' }),
    email: z.string().email().openapi({ description: 'Email address' }),
    fullName: z.string().nullable().openapi({ description: 'Full name' }),
    authProvider: z.string().openapi({ description: 'Auth provider' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
  }).openapi({
    description: 'User information',
  })
);

// Account response schema
export const accountResponseSchema = registry.register(
  'AccountResponse',
  z.object({
    user: userInfoSchema,
    billingInfo: z.object({
      fullName: z.string().openapi({ description: 'Full name' }),
      email: z.string().openapi({ description: 'Email' }),
      addressLine1: z.string().openapi({ description: 'Address line 1' }),
      addressLine2: z.string().nullable().openapi({ description: 'Address line 2' }),
      city: z.string().openapi({ description: 'City' }),
      state: z.string().openapi({ description: 'State' }),
      country: z.string().openapi({ description: 'Country' }),
      postalCode: z.string().openapi({ description: 'Postal code' }),
    }).nullable().openapi({ description: 'Billing information' }),
    stats: z.object({
      totalSites: z.number().int().openapi({ description: 'Total sites' }),
      activeSubscriptions: z.number().int().openapi({ description: 'Active subscriptions' }),
    }).openapi({ description: 'Account statistics' }),
  }).openapi({
    description: 'Account information response',
  })
);

// Billing info response schema
export const billingInfoResponseSchema = registry.register(
  'BillingInfoResponse',
  z.object({
    billingInfo: z.object({
      fullName: z.string().openapi({ description: 'Full name' }),
      email: z.string().openapi({ description: 'Email' }),
      addressLine1: z.string().openapi({ description: 'Address line 1' }),
      addressLine2: z.string().nullable().openapi({ description: 'Address line 2' }),
      city: z.string().openapi({ description: 'City' }),
      state: z.string().openapi({ description: 'State' }),
      country: z.string().openapi({ description: 'Country' }),
      postalCode: z.string().openapi({ description: 'Postal code' }),
    }).nullable().openapi({ description: 'Billing information' }),
  }).openapi({
    description: 'Billing info response',
  })
);

// Message response schema
export const messageResponseSchema = registry.register(
  'AccountMessageResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
  }).openapi({
    description: 'Simple message response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/account
registry.registerPath({
  method: 'get',
  path: '/api/v1/account',
  summary: 'Get current user account information',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Successfully retrieved account information',
      content: {
        'application/json': {
          schema: accountResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// PATCH /api/v1/account
registry.registerPath({
  method: 'patch',
  path: '/api/v1/account',
  summary: 'Update user account information',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateAccountSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Account updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            user: userInfoSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    409: {
      description: 'Email already in use',
    },
  },
});

// DELETE /api/v1/account
registry.registerPath({
  method: 'delete',
  path: '/api/v1/account',
  summary: 'Delete user account',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Account deleted successfully',
      content: {
        'application/json': {
          schema: messageResponseSchema,
        },
      },
    },
    400: {
      description: 'Cannot delete account with active subscriptions',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/v1/account/billing-info
registry.registerPath({
  method: 'get',
  path: '/api/v1/account/billing-info',
  summary: 'Get billing information',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Successfully retrieved billing information',
      content: {
        'application/json': {
          schema: billingInfoResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// PUT /api/v1/account/billing-info
registry.registerPath({
  method: 'put',
  path: '/api/v1/account/billing-info',
  summary: 'Update billing information',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateBillingInfoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Billing information updated',
      content: {
        'application/json': {
          schema: billingInfoResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// PATCH /api/v1/account/password
registry.registerPath({
  method: 'patch',
  path: '/api/v1/account/password',
  summary: 'Change password',
  tags: ['Account'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: changePasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password changed successfully',
      content: {
        'application/json': {
          schema: messageResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid current password',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// Type exports
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateBillingInfoInput = z.infer<typeof updateBillingInfoSchema>;
