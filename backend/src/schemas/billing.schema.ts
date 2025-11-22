import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Billing & Transactions Schemas
 * Centralized Zod validation schemas for billing-related endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Billing history query schema
export const billingHistoryQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().openapi({
    description: 'Page number for pagination',
    example: '1',
  }),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().openapi({
    description: 'Number of items per page (max 100)',
    example: '20',
  }),
  status: z.enum(['paid', 'pending', 'failed', 'all']).optional().openapi({
    description: 'Filter by transaction status',
    example: 'paid',
  }),
  siteId: z.string().uuid('Invalid site ID format').optional().openapi({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Transaction params schema
export const transactionParamsSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID format').openapi({
    description: 'Transaction unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Billing info schema
export const billingInfoSchema = registry.register(
  'BillingInfoRequest',
  z.object({
    fullName: z.string().min(1, 'Full name is required').openapi({
      description: 'Full name for billing',
      example: 'John Doe',
    }),
    email: z.string().email('Invalid email address').openapi({
      description: 'Billing email address',
      example: 'john@example.com',
    }),
    addressLine1: z.string().min(1, 'Address line 1 is required').openapi({
      description: 'Street address line 1',
      example: '123 Main Street',
    }),
    addressLine2: z.string().optional().openapi({
      description: 'Street address line 2 (optional)',
      example: 'Apt 4B',
    }),
    city: z.string().min(1, 'City is required').openapi({
      description: 'City',
      example: 'New York',
    }),
    state: z.string().min(1, 'State is required').openapi({
      description: 'State or province',
      example: 'NY',
    }),
    country: z.string().min(2, 'Country is required').max(2, 'Country must be 2-letter code').openapi({
      description: 'Country code (ISO 3166-1 alpha-2)',
      example: 'US',
    }),
    postalCode: z.string().min(1, 'Postal code is required').openapi({
      description: 'Postal or ZIP code',
      example: '10001',
    }),
  }).openapi({
    description: 'Billing information',
  })
);

// Update billing info schema
export const updateBillingInfoSchema = registry.register(
  'UpdateBillingInfoRequest',
  billingInfoSchema.partial().openapi({
    description: 'Update billing information (all fields optional)',
  })
);

// Billing response schemas
export const billingInfoResponseSchema = registry.register(
  'BillingInfoResponse',
  z.object({
    id: z.string().uuid().openapi({ description: 'Billing info ID' }),
    userId: z.string().uuid().openapi({ description: 'User ID' }),
    fullName: z.string().openapi({ description: 'Full name' }),
    email: z.string().email().openapi({ description: 'Email address' }),
    addressLine1: z.string().openapi({ description: 'Address line 1' }),
    addressLine2: z.string().nullable().openapi({ description: 'Address line 2' }),
    city: z.string().openapi({ description: 'City' }),
    state: z.string().openapi({ description: 'State' }),
    country: z.string().openapi({ description: 'Country code' }),
    postalCode: z.string().openapi({ description: 'Postal code' }),
    stripeCustomerId: z.string().nullable().openapi({ description: 'Stripe customer ID' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
  }).openapi({
    description: 'Billing information response',
  })
);

export const billingTransactionSchema = registry.register(
  'BillingTransaction',
  z.object({
    id: z.string().uuid().openapi({ description: 'Transaction ID' }),
    userId: z.string().uuid().openapi({ description: 'User ID' }),
    siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    site: z.object({
      id: z.string().uuid().openapi({ description: 'Site ID' }),
      siteName: z.string().openapi({ description: 'Site name' }),
    }).optional().openapi({ description: 'Site info' }),
    invoiceId: z.string().openapi({ description: 'Invoice ID' }),
    amount: z.number().openapi({ description: 'Transaction amount', example: 29.99 }),
    currency: z.string().default('USD').openapi({ description: 'Currency code', example: 'USD' }),
    status: z.enum(['paid', 'pending', 'failed']).openapi({ description: 'Transaction status' }),
    stripeInvoiceId: z.string().nullable().openapi({ description: 'Stripe invoice ID' }),
    createdAt: z.string().openapi({ description: 'Transaction timestamp' }),
  }).openapi({
    description: 'Billing transaction',
  })
);

// Active subscription item schema
const activeSubscriptionItemSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Subscription ID' }),
  siteId: z.string().uuid().openapi({ description: 'Site ID' }),
  siteName: z.string().openapi({ description: 'Site name' }),
  site: z.object({
    id: z.string().uuid().openapi({ description: 'Site ID' }),
    siteName: z.string().openapi({ description: 'Site name' }),
  }).optional().openapi({ description: 'Site info' }),
  planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({ description: 'Plan type' }),
  status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']).openapi({ description: 'Status' }),
  currentPeriodEnd: z.string().openapi({ description: 'Current period end' }),
  amount: z.number().openapi({ description: 'Amount' }),
});

// Upcoming charge item schema
const upcomingChargeItemSchema = z.object({
  siteId: z.string().uuid().openapi({ description: 'Site ID' }),
  siteName: z.string().openapi({ description: 'Site name' }),
  amount: z.number().openapi({ description: 'Amount' }),
  dueDate: z.string().openapi({ description: 'Due date' }),
  planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({ description: 'Plan type' }),
});

export const billingSummarySchema = registry.register(
  'BillingSummary',
  z.object({
    totalSpent: z.number().openapi({ description: 'Total amount spent', example: 299.99 }),
    currentMonthSpent: z.number().openapi({ description: 'Current month spending', example: 29.99 }),
    transactionCount: z.number().int().openapi({ description: 'Total number of transactions', example: 10 }),
    nextBillingDate: z.string().nullable().openapi({ description: 'Next billing date', example: '2024-01-15' }),
    activeSubscriptions: z.array(activeSubscriptionItemSchema).optional().openapi({ description: 'Active subscriptions' }),
    upcomingCharges: z.array(upcomingChargeItemSchema).optional().openapi({ description: 'Upcoming charges' }),
  }).openapi({
    description: 'Billing summary statistics',
  })
);

// Billing history response schema
export const billingHistoryResponseSchema = registry.register(
  'BillingHistoryResponse',
  z.object({
    transactions: z.array(billingTransactionSchema).openapi({ description: 'List of transactions' }),
    pagination: z.object({
      page: z.number().int().openapi({ description: 'Current page' }),
      limit: z.number().int().openapi({ description: 'Items per page' }),
      total: z.number().int().openapi({ description: 'Total items' }),
      totalPages: z.number().int().openapi({ description: 'Total pages' }),
      pages: z.number().int().optional().openapi({ description: 'Total pages (alias)' }),
    }).openapi({ description: 'Pagination info' }),
    summary: z.object({
      totalAmount: z.number().openapi({ description: 'Total amount' }),
      totalTransactions: z.number().int().optional().openapi({ description: 'Total transactions' }),
      statusCounts: z.object({
        paid: z.number().int().openapi({ description: 'Paid count' }),
        pending: z.number().int().openapi({ description: 'Pending count' }),
        failed: z.number().int().openapi({ description: 'Failed count' }),
      }).openapi({ description: 'Status counts' }),
    }).openapi({ description: 'Summary statistics' }),
  }).openapi({
    description: 'Billing history response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/billing/history
registry.registerPath({
  method: 'get',
  path: '/api/v1/billing/history',
  summary: 'Get billing transaction history',
  tags: ['Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    query: billingHistoryQuerySchema,
  },
  responses: {
    200: {
      description: 'Billing history retrieved successfully',
      content: {
        'application/json': {
          schema: billingHistoryResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/v1/billing/summary
registry.registerPath({
  method: 'get',
  path: '/api/v1/billing/summary',
  summary: 'Get billing summary',
  tags: ['Billing'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Billing summary retrieved successfully',
      content: {
        'application/json': {
          schema: billingSummarySchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/v1/billing/transactions/{transactionId}
registry.registerPath({
  method: 'get',
  path: '/api/v1/billing/transactions/{transactionId}',
  summary: 'Get transaction details',
  tags: ['Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: transactionParamsSchema,
  },
  responses: {
    200: {
      description: 'Transaction details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            transaction: billingTransactionSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Transaction not found',
    },
  },
});

// Type exports
export type BillingHistoryQuery = z.infer<typeof billingHistoryQuerySchema>;
export type TransactionParams = z.infer<typeof transactionParamsSchema>;
export type BillingInfoInput = z.infer<typeof billingInfoSchema>;
export type UpdateBillingInfoInput = z.infer<typeof updateBillingInfoSchema>;
