import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Admin Audit Log Schemas
 * Centralized Zod validation schemas for admin audit endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Enums
// ============================================

const auditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'LOGIN',
  'LOGOUT',
  'FORCE_LOGOUT',
  'EXTEND_TRIAL',
  'RECRAWL',
  'REPROCESS',
  'CLEANUP',
  'EXPORT',
  'BULK_UPDATE',
  'BULK_DELETE',
]).openapi({ description: 'Type of admin action' });

const auditEntityTypeSchema = z.enum([
  'USER',
  'SITE',
  'URL',
  'EMBEDDING',
  'FILE',
  'CONVERSATION',
  'MESSAGE',
  'SUBSCRIPTION',
  'TRANSACTION',
  'SESSION',
  'WIDGET',
  'BILLING_INFO',
]).openapi({ description: 'Type of entity affected' });

// ============================================
// Audit Log Schemas
// ============================================

const auditLogSchema = registry.register(
  'AuditLog',
  z.object({
    id: z.string().uuid().openapi({ description: 'Audit log ID' }),
    adminId: z.string().uuid().openapi({ description: 'Admin user ID who performed the action' }),
    adminEmail: z.string().email().openapi({ description: 'Admin email (denormalized)' }),
    action: auditActionSchema,
    entityType: auditEntityTypeSchema,
    entityId: z.string().nullable().openapi({ description: 'ID of affected entity' }),
    entityName: z.string().nullable().openapi({ description: 'Human-readable entity name' }),
    oldValues: z.any().nullable().openapi({ description: 'Previous values (JSON)' }),
    newValues: z.any().nullable().openapi({ description: 'New values (JSON)' }),
    metadata: z.any().nullable().openapi({ description: 'Additional context (JSON)' }),
    ipAddress: z.string().nullable().openapi({ description: 'Request IP address' }),
    success: z.boolean().openapi({ description: 'Whether action succeeded' }),
    errorMessage: z.string().nullable().openapi({ description: 'Error message if failed' }),
    createdAt: z.string().openapi({ description: 'Timestamp of action' }),
  }).openapi({ description: 'Audit log entry' })
);

const auditLogDetailSchema = registry.register(
  'AuditLogDetail',
  auditLogSchema.extend({
    userAgent: z.string().nullable().openapi({ description: 'User agent of request' }),
  }).openapi({ description: 'Detailed audit log entry' })
);

const auditLogsListSchema = registry.register(
  'AuditLogsList',
  z.object({
    logs: z.array(auditLogSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  }).openapi({ description: 'Paginated audit logs list' })
);

const auditStatsSchema = registry.register(
  'AuditStats',
  z.object({
    totalLogs: z.number().int().openapi({ description: 'Total audit logs' }),
    logsToday: z.number().int().openapi({ description: 'Logs created today' }),
    logsThisWeek: z.number().int().openapi({ description: 'Logs created this week' }),
    logsThisMonth: z.number().int().openapi({ description: 'Logs created this month' }),
    failedActions: z.number().int().openapi({ description: 'Failed actions count' }),
    actionBreakdown: z.array(z.object({
      action: auditActionSchema,
      count: z.number().int(),
    })).openapi({ description: 'Breakdown by action type' }),
    entityTypeBreakdown: z.array(z.object({
      entityType: auditEntityTypeSchema,
      count: z.number().int(),
    })).openapi({ description: 'Breakdown by entity type' }),
    topAdmins: z.array(z.object({
      adminId: z.string().uuid(),
      adminEmail: z.string().email(),
      actionCount: z.number().int(),
    })).openapi({ description: 'Most active admins' }),
  }).openapi({ description: 'Audit statistics' })
);

const entityHistorySchema = registry.register(
  'EntityAuditHistory',
  z.array(z.object({
    id: z.string().uuid(),
    adminEmail: z.string().email(),
    action: auditActionSchema,
    oldValues: z.any().nullable(),
    newValues: z.any().nullable(),
    success: z.boolean(),
    createdAt: z.string(),
  })).openapi({ description: 'Audit history for an entity' })
);

const auditCleanupResponseSchema = registry.register(
  'AuditCleanupResponse',
  z.object({
    success: z.boolean(),
    message: z.string(),
    count: z.number().int().openapi({ description: 'Number of logs deleted' }),
  }).openapi({ description: 'Audit cleanup response' })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/admin/audit
registry.registerPath({
  method: 'get',
  path: '/admin/audit',
  summary: 'Get paginated list of audit logs',
  tags: ['Admin - Audit'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().openapi({ description: 'Page number', example: '1' }),
      limit: z.string().optional().openapi({ description: 'Items per page (max 100)', example: '50' }),
      adminId: z.string().uuid().optional().openapi({ description: 'Filter by admin ID' }),
      action: auditActionSchema.optional().openapi({ description: 'Filter by action type' }),
      entityType: auditEntityTypeSchema.optional().openapi({ description: 'Filter by entity type' }),
      entityId: z.string().optional().openapi({ description: 'Filter by entity ID' }),
      startDate: z.string().optional().openapi({ description: 'Filter from date (ISO 8601)' }),
      endDate: z.string().optional().openapi({ description: 'Filter to date (ISO 8601)' }),
      success: z.enum(['true', 'false']).optional().openapi({ description: 'Filter by success status' }),
      sortOrder: z.enum(['asc', 'desc']).optional().openapi({ description: 'Sort order' }),
    }),
  },
  responses: {
    200: {
      description: 'List of audit logs',
      content: {
        'application/json': {
          schema: z.object({ data: auditLogsListSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/audit/stats
registry.registerPath({
  method: 'get',
  path: '/admin/audit/stats',
  summary: 'Get audit statistics',
  tags: ['Admin - Audit'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Audit statistics',
      content: {
        'application/json': {
          schema: z.object({ data: auditStatsSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/audit/entity/{entityType}/{entityId}
registry.registerPath({
  method: 'get',
  path: '/admin/audit/entity/{entityType}/{entityId}',
  summary: 'Get audit history for a specific entity',
  tags: ['Admin - Audit'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      entityType: auditEntityTypeSchema.openapi({ description: 'Entity type' }),
      entityId: z.string().openapi({ description: 'Entity ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Entity audit history',
      content: {
        'application/json': {
          schema: z.object({ data: entityHistorySchema }),
        },
      },
    },
    400: { description: 'Invalid entity type' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// GET /api/v1/admin/audit/{id}
registry.registerPath({
  method: 'get',
  path: '/admin/audit/{id}',
  summary: 'Get a single audit log by ID',
  tags: ['Admin - Audit'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Audit log ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Audit log details',
      content: {
        'application/json': {
          schema: z.object({ data: auditLogDetailSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    404: { description: 'Audit log not found' },
  },
});

// GET /api/v1/admin/audit/export/download
registry.registerPath({
  method: 'get',
  path: '/admin/audit/export/download',
  summary: 'Export audit logs',
  tags: ['Admin - Audit'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      startDate: z.string().optional().openapi({ description: 'Filter from date (ISO 8601)' }),
      endDate: z.string().optional().openapi({ description: 'Filter to date (ISO 8601)' }),
      adminId: z.string().uuid().optional().openapi({ description: 'Filter by admin ID' }),
      entityType: auditEntityTypeSchema.optional().openapi({ description: 'Filter by entity type' }),
      format: z.enum(['json', 'csv']).optional().openapi({ description: 'Export format', example: 'json' }),
    }),
  },
  responses: {
    200: {
      description: 'Exported audit logs file',
      content: {
        'application/json': {
          schema: z.array(auditLogSchema),
        },
        'text/csv': {
          schema: z.string(),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// POST /api/v1/admin/audit/cleanup
registry.registerPath({
  method: 'post',
  path: '/admin/audit/cleanup',
  summary: 'Clean up old audit logs',
  tags: ['Admin - Audit'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            retentionDays: z.number().int().min(30).max(3650).optional()
              .openapi({ description: 'Days to retain (default 365)', example: 365 }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Cleanup completed',
      content: {
        'application/json': {
          schema: auditCleanupResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// Type exports
export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogsList = z.infer<typeof auditLogsListSchema>;
export type AuditStats = z.infer<typeof auditStatsSchema>;
