import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Admin Sessions Schemas
 * Centralized Zod validation schemas for admin sessions endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Session Schemas
// ============================================

const adminSessionUserSchema = z.object({
  id: z.string().uuid().openapi({ description: 'User ID' }),
  email: z.string().email().openapi({ description: 'User email' }),
  fullName: z.string().nullable().openapi({ description: 'User full name' }),
});

const adminSessionSchema = registry.register(
  'AdminSession',
  z.object({
    id: z.string().uuid().openapi({ description: 'Session ID' }),
    tokenPreview: z.string().openapi({ description: 'Masked token preview' }),
    userId: z.string().uuid().openapi({ description: 'User ID' }),
    user: adminSessionUserSchema.nullable().openapi({ description: 'User info' }),
    expiresAt: z.string().openapi({ description: 'Expiration timestamp' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    isExpired: z.boolean().openapi({ description: 'Whether session is expired' }),
  }).openapi({ description: 'Admin session information' })
);

const adminSessionsListSchema = registry.register(
  'AdminSessionsList',
  z.object({
    sessions: z.array(adminSessionSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  }).openapi({ description: 'Admin sessions list response' })
);

const adminSessionStatsSchema = registry.register(
  'AdminSessionStats',
  z.object({
    totalSessions: z.number().int().openapi({ description: 'Total sessions' }),
    activeSessions: z.number().int().openapi({ description: 'Active (non-expired) sessions' }),
    expiredTokensNeedingCleanup: z.number().int().openapi({ description: 'Expired sessions needing cleanup' }),
    sessionsCreatedLast24h: z.number().int().openapi({ description: 'Sessions created in last 24 hours' }),
    usersWithMultipleSessions: z.number().int().openapi({ description: 'Users with multiple active sessions' }),
  }).openapi({ description: 'Session statistics' })
);

const adminUserSessionsSchema = registry.register(
  'AdminUserSessions',
  z.object({
    user: adminSessionUserSchema,
    sessions: z.array(z.object({
      id: z.string().uuid(),
      tokenPreview: z.string(),
      expiresAt: z.string(),
      createdAt: z.string(),
      isExpired: z.boolean(),
    })),
    totalSessions: z.number().int(),
    activeSessions: z.number().int(),
  }).openapi({ description: 'User sessions response' })
);

const sessionActionResponseSchema = registry.register(
  'SessionActionResponse',
  z.object({
    success: z.boolean(),
    message: z.string(),
    count: z.number().int().optional(),
  }).openapi({ description: 'Session action response' })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/admin/sessions
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/sessions',
  summary: 'Get paginated list of sessions',
  tags: ['Admin - Sessions'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().openapi({ description: 'Page number', example: '1' }),
      limit: z.string().optional().openapi({ description: 'Items per page', example: '20' }),
      userId: z.string().uuid().optional().openapi({ description: 'Filter by user ID' }),
      expired: z.enum(['true', 'false']).optional().openapi({ description: 'Filter by expired status' }),
      sortBy: z.enum(['createdAt', 'expiresAt']).optional().openapi({ description: 'Sort field' }),
      sortOrder: z.enum(['asc', 'desc']).optional().openapi({ description: 'Sort order' }),
    }),
  },
  responses: {
    200: {
      description: 'List of sessions',
      content: {
        'application/json': {
          schema: z.object({ data: adminSessionsListSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/sessions/stats
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/sessions/stats',
  summary: 'Get session statistics',
  tags: ['Admin - Sessions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Session statistics',
      content: {
        'application/json': {
          schema: z.object({ data: adminSessionStatsSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/sessions/user/{userId}
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/sessions/user/{userId}',
  summary: 'Get sessions for a specific user',
  tags: ['Admin - Sessions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({ description: 'User ID' }),
    }),
  },
  responses: {
    200: {
      description: 'User sessions',
      content: {
        'application/json': {
          schema: z.object({ data: adminUserSessionsSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'User not found' },
  },
});

// DELETE /api/v1/admin/sessions/user/{userId}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/sessions/user/{userId}',
  summary: 'Revoke all sessions for a user (force logout)',
  tags: ['Admin - Sessions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({ description: 'User ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Sessions revoked',
      content: {
        'application/json': {
          schema: sessionActionResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'User not found' },
  },
});

// DELETE /api/v1/admin/sessions/{sessionId}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/sessions/{sessionId}',
  summary: 'Revoke a specific session',
  tags: ['Admin - Sessions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      sessionId: z.string().uuid().openapi({ description: 'Session ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Session revoked',
      content: {
        'application/json': {
          schema: sessionActionResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'Session not found' },
  },
});

// POST /api/v1/admin/sessions/cleanup
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/sessions/cleanup',
  summary: 'Clean up expired sessions',
  tags: ['Admin - Sessions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Cleanup completed',
      content: {
        'application/json': {
          schema: sessionActionResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// Type exports
export type AdminSession = z.infer<typeof adminSessionSchema>;
export type AdminSessionsList = z.infer<typeof adminSessionsListSchema>;
export type AdminSessionStats = z.infer<typeof adminSessionStatsSchema>;
