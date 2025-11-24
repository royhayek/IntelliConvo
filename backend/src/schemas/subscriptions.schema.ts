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
    returnUrl: z.string().optional().openapi({
      description: 'URL to redirect to after checkout (defaults to onboarding)',
      example: '/account/subscriptions',
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
    cancelAtPeriodEnd: z.boolean().openapi({ description: 'Whether subscription is scheduled to cancel at period end' }),
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
    currency: z.string().optional().openapi({ description: 'Currency code (e.g., USD)' }),
    billingPeriod: z.enum(['monthly', 'annual']).openapi({ description: 'Billing period' }),
    interval: z.enum(['monthly', 'annual']).optional().openapi({ description: 'Billing interval (alias)' }),
    features: z.array(z.string()).openapi({ description: 'Plan features' }),
    trialDays: z.number().optional().openapi({ description: 'Number of trial days (0 or undefined means no trial)' }),
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
    subscription: subscriptionSchema.nullable().openapi({ description: 'Created subscription (may be null if checkout required)' }),
    checkoutUrl: z.string().nullable().openapi({ description: 'Stripe checkout URL to complete payment' }),
    testMode: z.boolean().optional().openapi({ description: 'Whether Stripe is in test mode' }),
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
  description: 'Retrieve user subscriptions, optionally filtered by site',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    query: subscriptionQuerySchema,
  },
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

// POST /api/v1/billing/subscriptions/{subscriptionId}/reactivate
registry.registerPath({
  method: 'post',
  path: '/api/v1/billing/subscriptions/{subscriptionId}/reactivate',
  summary: 'Reactivate subscription',
  description: 'Removes the pending cancellation from a subscription. Only works if subscription has cancelAtPeriodEnd set to true.',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: subscriptionParamsSchema,
  },
  responses: {
    200: {
      description: 'Subscription reactivated successfully',
      content: {
        'application/json': {
          schema: subscriptionSchema,
        },
      },
    },
    400: {
      description: 'Subscription is not scheduled for cancellation',
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

// Change plan schema
export const changePlanSchema = registry.register(
  'ChangePlanRequest',
  z.object({
    newPlanType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({
      description: 'New plan type to switch to',
      example: 'PREMIUM_ANNUAL',
    }),
  }).openapi({
    description: 'Change subscription plan',
  })
);

// Proration preview response schema
export const prorationPreviewSchema = registry.register(
  'ProrationPreview',
  z.object({
    currentPlan: z.object({
      id: z.string().openapi({ description: 'Current plan ID' }),
      name: z.string().openapi({ description: 'Current plan name' }),
      price: z.number().openapi({ description: 'Current plan price' }),
    }).openapi({ description: 'Current plan details' }),
    newPlan: z.object({
      id: z.string().openapi({ description: 'New plan ID' }),
      name: z.string().openapi({ description: 'New plan name' }),
      price: z.number().openapi({ description: 'New plan price' }),
    }).openapi({ description: 'New plan details' }),
    prorationAmount: z.number().openapi({ description: 'Proration charge amount (positive = charge, negative = credit)' }),
    creditAmount: z.number().openapi({ description: 'Credit amount from unused time on current plan' }),
    amountDue: z.number().openapi({ description: 'Net amount due (0 if credit exceeds charge)' }),
    currency: z.string().openapi({ description: 'Currency code' }),
    effectiveDate: z.string().openapi({ description: 'When the plan change takes effect' }),
    billingCycleAnchor: z.string().openapi({ description: 'Next billing date' }),
  }).openapi({
    description: 'Proration preview for plan change',
  })
);

// Change plan response schema
export const changePlanResponseSchema = registry.register(
  'ChangePlanResponse',
  z.object({
    subscription: subscriptionSchema.openapi({ description: 'Updated subscription' }),
    proration: prorationPreviewSchema.openapi({ description: 'Proration details' }),
  }).openapi({
    description: 'Change plan response',
  })
);

// POST /api/v1/billing/subscriptions/{subscriptionId}/change-plan
registry.registerPath({
  method: 'post',
  path: '/api/v1/billing/subscriptions/{subscriptionId}/change-plan',
  summary: 'Change subscription plan',
  description: 'Upgrade or downgrade subscription plan. Stripe handles proration automatically.',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: subscriptionParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: changePlanSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Plan changed successfully',
      content: {
        'application/json': {
          schema: changePlanResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error or already on this plan',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Subscription not found',
    },
  },
});

// GET /api/v1/billing/subscriptions/{subscriptionId}/preview-change
registry.registerPath({
  method: 'get',
  path: '/api/v1/billing/subscriptions/{subscriptionId}/preview-change',
  summary: 'Preview plan change proration',
  description: 'Get a preview of charges/credits for changing to a different plan',
  tags: ['Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: subscriptionParamsSchema,
    query: z.object({
      newPlanType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({
        description: 'Plan type to preview',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Proration preview retrieved successfully',
      content: {
        'application/json': {
          schema: prorationPreviewSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Subscription not found',
    },
  },
});

// Type exports
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
export type SubscriptionParams = z.infer<typeof subscriptionParamsSchema>;
export type SubscriptionQuery = z.infer<typeof subscriptionQuerySchema>;
