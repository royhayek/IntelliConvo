import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Admin Email Log Schemas
 * Centralized Zod validation schemas for admin email endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Enums
// ============================================

const emailTypeSchema = z.enum([
  'WELCOME',
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
  'SUBSCRIPTION_ACTIVATED',
  'TRIAL_EXPIRING',
  'TRIAL_EXPIRED',
  'PAYMENT_FAILED',
  'PAYMENT_RECEIPT',
  'SITE_READY',
  'SUBSCRIPTION_CANCELLED',
]).openapi({ description: 'Type of email' });

const emailStatusSchema = z.enum([
  'PENDING',
  'QUEUED',
  'SENT',
  'FAILED',
  'BOUNCED',
]).openapi({ description: 'Email delivery status' });

// ============================================
// Email Log Schemas
// ============================================

const emailLogUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
}).openapi({ description: 'User associated with email' });

const emailLogSchema = registry.register(
  'EmailLog',
  z.object({
    id: z.string().uuid().openapi({ description: 'Email log ID' }),
    email: z.string().email().openapi({ description: 'Recipient email address' }),
    type: emailTypeSchema,
    subject: z.string().openapi({ description: 'Email subject line' }),
    status: emailStatusSchema,
    provider: z.string().nullable().openapi({ description: 'Email provider used' }),
    messageId: z.string().nullable().openapi({ description: 'Provider message ID' }),
    errorMessage: z.string().nullable().openapi({ description: 'Error message if failed' }),
    attempts: z.number().int().openapi({ description: 'Number of send attempts' }),
    lastAttemptAt: z.string().nullable().openapi({ description: 'Last attempt timestamp' }),
    sentAt: z.string().nullable().openapi({ description: 'Successfully sent timestamp' }),
    createdAt: z.string().openapi({ description: 'Created timestamp' }),
    user: emailLogUserSchema.nullable().openapi({ description: 'Associated user' }),
  }).openapi({ description: 'Email log entry' })
);

const emailLogDetailSchema = registry.register(
  'EmailLogDetail',
  emailLogSchema.extend({
    templateData: z.any().nullable().openapi({ description: 'Template data used' }),
  }).openapi({ description: 'Detailed email log entry' })
);

const emailLogsListSchema = registry.register(
  'EmailLogsList',
  z.object({
    logs: z.array(emailLogSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  }).openapi({ description: 'Paginated email logs list' })
);

const emailStatsSchema = registry.register(
  'EmailStats',
  z.object({
    total: z.number().int().openapi({ description: 'Total emails sent' }),
    sent: z.number().int().openapi({ description: 'Successfully sent emails' }),
    failed: z.number().int().openapi({ description: 'Failed emails' }),
    pending: z.number().int().openapi({ description: 'Pending/queued emails' }),
    successRate: z.string().openapi({ description: 'Success rate percentage' }),
    byType: z.array(z.object({
      type: emailTypeSchema,
      count: z.number().int(),
    })).openapi({ description: 'Breakdown by email type' }),
    dailyActivity: z.array(z.object({
      date: z.string(),
      sent: z.number().int(),
      failed: z.number().int(),
    })).openapi({ description: 'Daily email activity for last 7 days' }),
  }).openapi({ description: 'Email statistics' })
);

const emailProviderStatusSchema = registry.register(
  'EmailProviderStatus',
  z.object({
    initialized: z.boolean().openapi({ description: 'Whether email service is initialized' }),
    provider: z.string().nullable().openapi({ description: 'Current provider name' }),
    isValid: z.boolean().optional().openapi({ description: 'Provider verification status' }),
  }).openapi({ description: 'Email provider status' })
);

const emailRetryResponseSchema = registry.register(
  'EmailRetryResponse',
  z.object({
    success: z.boolean(),
    message: z.string(),
  }).openapi({ description: 'Email retry response' })
);

const emailTestResponseSchema = registry.register(
  'EmailTestResponse',
  z.object({
    success: z.boolean(),
    message: z.string(),
    messageId: z.string().optional().openapi({ description: 'Provider message ID' }),
  }).openapi({ description: 'Test email response' })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/admin/emails
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/emails',
  summary: 'Get paginated list of email logs',
  tags: ['Admin - Emails'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().openapi({ description: 'Page number', example: '1' }),
      limit: z.string().optional().openapi({ description: 'Items per page (max 100)', example: '50' }),
      type: emailTypeSchema.optional().openapi({ description: 'Filter by email type' }),
      status: emailStatusSchema.optional().openapi({ description: 'Filter by status' }),
      userId: z.string().uuid().optional().openapi({ description: 'Filter by user ID' }),
      email: z.string().optional().openapi({ description: 'Filter by email address (partial match)' }),
      startDate: z.string().optional().openapi({ description: 'Filter from date (ISO 8601)' }),
      endDate: z.string().optional().openapi({ description: 'Filter to date (ISO 8601)' }),
      sortOrder: z.enum(['asc', 'desc']).optional().openapi({ description: 'Sort order' }),
    }),
  },
  responses: {
    200: {
      description: 'List of email logs',
      content: {
        'application/json': {
          schema: z.object({ data: emailLogsListSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/emails/stats
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/emails/stats',
  summary: 'Get email statistics',
  tags: ['Admin - Emails'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Email statistics',
      content: {
        'application/json': {
          schema: z.object({ data: emailStatsSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/emails/provider/status
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/emails/provider/status',
  summary: 'Get email provider status',
  tags: ['Admin - Emails'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Email provider status',
      content: {
        'application/json': {
          schema: z.object({ data: emailProviderStatusSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/emails/{id}
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/emails/{id}',
  summary: 'Get a single email log by ID',
  tags: ['Admin - Emails'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Email log ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Email log details',
      content: {
        'application/json': {
          schema: z.object({ data: emailLogDetailSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'Email log not found' },
  },
});

// POST /api/v1/admin/emails/{id}/retry
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/emails/{id}/retry',
  summary: 'Retry a failed email',
  tags: ['Admin - Emails'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Email log ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Email retry queued',
      content: {
        'application/json': {
          schema: z.object({ data: emailRetryResponseSchema }),
        },
      },
    },
    400: { description: 'Cannot retry email (not failed or other error)' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'Email log not found' },
  },
});

// POST /api/v1/admin/emails/test
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/emails/test',
  summary: 'Send a test email',
  tags: ['Admin - Emails'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().openapi({ description: 'Email address to send test to' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Test email sent',
      content: {
        'application/json': {
          schema: z.object({ data: emailTestResponseSchema }),
        },
      },
    },
    400: { description: 'Invalid email or send failed' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// Type exports
export type EmailLog = z.infer<typeof emailLogSchema>;
export type EmailLogsList = z.infer<typeof emailLogsListSchema>;
export type EmailStats = z.infer<typeof emailStatsSchema>;
