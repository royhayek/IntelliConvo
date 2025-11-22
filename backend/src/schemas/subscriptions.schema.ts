import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Subscriptions Schemas
 * Centralized Zod validation schemas for subscription management with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Create subscription schema
export const createSubscriptionSchema = registry.register(
  'CreateSubscriptionRequest',
  z.object({
    siteId: z.string().uuid('Invalid site ID format').openapi({
      description: 'Site ID to create subscription for',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({
      description: 'Subscription plan type',
      example: 'PREMIUM_MONTHLY',
    }),
    paymentMethodId: z.string().optional().openapi({
      description: 'Stripe payment method ID',
      example: 'pm_1234567890',
    }),
  }).openapi({
    description: 'Create a new subscription',
  })
);

// Update subscription schema
export const updateSubscriptionSchema = registry.register(
  'UpdateSubscriptionRequest',
  z.object({
    planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).optional().openapi({
      description: 'New plan type',
      example: 'PREMIUM_ANNUAL',
    }),
  }).openapi({
    description: 'Update subscription plan',
  })
);

// Cancel subscription schema
export const cancelSubscriptionSchema = registry.register(
  'CancelSubscriptionRequest',
  z.object({
    reason: z.string().optional().openapi({
      description: 'Reason for cancellation',
      example: 'No longer needed',
    }),
    immediately: z.boolean().default(false).openapi({
      description: 'Cancel immediately or at period end',
      example: false,
    }),
  }).openapi({
    description: 'Cancel subscription',
  })
);

// Subscription params schema
export const subscriptionParamsSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID format').openapi({
    description: 'Subscription unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Subscription query schema
export const subscriptionQuerySchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'all']).optional().openapi({
    description: 'Filter by subscription status',
    example: 'ACTIVE',
  }),
  siteId: z.string().uuid('Invalid site ID format').optional().openapi({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Subscription response schemas
export const subscriptionSchema = registry.register(
  'Subscription',
  z.object({
    id: z.string().uuid().openapi({ description: 'Subscription ID' }),
    userId: z.string().uuid().openapi({ description: 'User ID' }),
    siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({ description: 'Plan type' }),
    status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']).openapi({ description: 'Subscription status' }),
    trialEndsAt: z.string().nullable().openapi({ description: 'Trial end date' }),
    currentPeriodStart: z.string().openapi({ description: 'Current period start' }),
    currentPeriodEnd: z.string().openapi({ description: 'Current period end' }),
    stripeSubscriptionId: z.string().nullable().openapi({ description: 'Stripe subscription ID' }),
    stripePriceId: z.string().nullable().openapi({ description: 'Stripe price ID' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
    cancelledAt: z.string().nullable().openapi({ description: 'Cancellation timestamp' }),
  }).openapi({
    description: 'Subscription information',
  })
);

export const planSchema = registry.register(
  'Plan',
  z.object({
    id: z.string().openapi({ description: 'Plan ID' }),
    name: z.string().openapi({ description: 'Plan name' }),
    description: z.string().openapi({ description: 'Plan description' }),
    price: z.number().openapi({ description: 'Price in dollars' }),
    billingPeriod: z.enum(['monthly', 'annual']).openapi({ description: 'Billing period' }),
    interval: z.enum(['monthly', 'annual']).optional().openapi({ description: 'Billing interval (alias)' }),
    features: z.array(z.string()).openapi({ description: 'Plan features' }),
  }).openapi({
    description: 'Available subscription plan',
  })
);

// Subscriptions list response schema
export const subscriptionsListResponseSchema = registry.register(
  'SubscriptionsListResponse',
  z.array(subscriptionSchema).openapi({
    description: 'List of subscriptions',
  })
);

// Plans list response schema
export const plansListResponseSchema = registry.register(
  'PlansListResponse',
  z.array(planSchema).openapi({
    description: 'List of available plans',
  })
);

// Create subscription response schema
export const createSubscriptionResponseSchema = registry.register(
  'CreateSubscriptionResponse',
  z.object({
    subscription: subscriptionSchema,
    clientSecret: z.string().nullable().openapi({ description: 'Stripe client secret for payment' }),
  }).openapi({
    description: 'Create subscription response',
  })
);

// Portal URL response schema
export const portalUrlResponseSchema = registry.register(
  'PortalUrlResponse',
  z.object({
    url: z.string().url().openapi({ description: 'Stripe customer portal URL' }),
  }).openapi({
    description: 'Customer portal URL response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/billing/subscriptions
registry.registerPath({
  method: 'get',
  path: '/api/v1/billing/subscriptions',
  summary: 'Get user subscriptions',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Subscriptions retrieved successfully',
      content: {
        'application/json': {
          schema: subscriptionsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// POST /api/v1/billing/subscriptions
registry.registerPath({
  method: 'post',
  path: '/api/v1/billing/subscriptions',
  summary: 'Create subscription',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createSubscriptionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Subscription created successfully',
      content: {
        'application/json': {
          schema: createSubscriptionResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// POST /api/v1/billing/subscriptions/{subscriptionId}/cancel
registry.registerPath({
  method: 'post',
  path: '/api/v1/billing/subscriptions/{subscriptionId}/cancel',
  summary: 'Cancel subscription',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: subscriptionParamsSchema,
  },
  responses: {
    200: {
      description: 'Subscription cancelled successfully',
      content: {
        'application/json': {
          schema: subscriptionSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Subscription not found',
    },
  },
});

// POST /api/v1/billing/subscriptions/{subscriptionId}/portal
registry.registerPath({
  method: 'post',
  path: '/api/v1/billing/subscriptions/{subscriptionId}/portal',
  summary: 'Get customer portal URL',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: subscriptionParamsSchema,
  },
  responses: {
    200: {
      description: 'Portal URL retrieved successfully',
      content: {
        'application/json': {
          schema: portalUrlResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Subscription not found',
    },
  },
});

// GET /api/v1/billing/plans
registry.registerPath({
  method: 'get',
  path: '/api/v1/billing/plans',
  summary: 'Get available plans',
  tags: ['Subscriptions'],
  responses: {
    200: {
      description: 'Plans retrieved successfully',
      content: {
        'application/json': {
          schema: plansListResponseSchema,
        },
      },
    },
  },
});

// Type exports
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type SubscriptionParams = z.infer<typeof subscriptionParamsSchema>;
export type SubscriptionQuery = z.infer<typeof subscriptionQuerySchema>;
