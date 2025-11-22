/**
 * Admin Audit Service
 * Service for logging and querying admin actions for security and compliance
 */

import { prisma } from '../../lib/prisma';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';

export interface AuditLogInput {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

interface GetAuditLogsOptions {
  page: number;
  limit: number;
  adminId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

class AdminAuditService {
  /**
   * Log an admin action
   */
  async log(input: AuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          adminId: input.adminId,
          adminEmail: input.adminEmail,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId || null,
          entityName: input.entityName || null,
          oldValues: input.oldValues as Prisma.JsonObject || null,
          newValues: input.newValues as Prisma.JsonObject || null,
          metadata: input.metadata as Prisma.JsonObject || null,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
          success: input.success ?? true,
          errorMessage: input.errorMessage || null,
        },
      });
    } catch (error) {
      // Don't let audit logging failures break the main operation
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Helper method to log with request context
   */
  async logWithRequest(
    req: { user?: { id: string; email: string }; ip?: string; headers?: Record<string, string | string[] | undefined> },
    input: Omit<AuditLogInput, 'adminId' | 'adminEmail' | 'ipAddress' | 'userAgent'>
  ) {
    if (!req.user) {
      console.error('Cannot log audit: no user in request');
      return null;
    }

    return this.log({
      ...input,
      adminId: req.user.id,
      adminEmail: req.user.email,
      ipAddress: req.ip || (req.headers?.['x-forwarded-for'] as string) || undefined,
      userAgent: req.headers?.['user-agent'] as string || undefined,
    });
  }

  /**
   * Get paginated list of audit logs
   */
  async getAuditLogs(options: GetAuditLogsOptions) {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      success,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (adminId) {
      where.adminId = adminId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (success !== undefined) {
      where.success = success;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        adminId: log.adminId,
        adminEmail: log.adminEmail,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        oldValues: log.oldValues,
        newValues: log.newValues,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        success: log.success,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      return null;
    }

    return {
      id: log.id,
      adminId: log.adminId,
      adminEmail: log.adminEmail,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      oldValues: log.oldValues,
      newValues: log.newValues,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityHistory(entityType: AuditEntityType, entityId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 actions
    });

    return logs.map((log) => ({
      id: log.id,
      adminEmail: log.adminEmail,
      action: log.action,
      oldValues: log.oldValues,
      newValues: log.newValues,
      success: log.success,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  /**
   * Get audit statistics
   */
  async getAuditStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      failedActions,
      actionCounts,
      entityTypeCounts,
      topAdmins,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: thisWeek } },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.auditLog.count({
        where: { success: false },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
      }),
      prisma.auditLog.groupBy({
        by: ['adminId', 'adminEmail'],
        _count: { adminId: true },
        orderBy: { _count: { adminId: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalLogs,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      failedActions,
      actionBreakdown: actionCounts.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      entityTypeBreakdown: entityTypeCounts.map((item) => ({
        entityType: item.entityType,
        count: item._count.entityType,
      })),
      topAdmins: topAdmins.map((item) => ({
        adminId: item.adminId,
        adminEmail: item.adminEmail,
        actionCount: item._count.adminId,
      })),
    };
  }

  /**
   * Clean up old audit logs (for GDPR compliance or storage management)
   */
  async cleanupOldLogs(retentionDays: number = 365) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return {
      success: true,
      message: `Deleted ${result.count} audit logs older than ${retentionDays} days`,
      count: result.count,
    };
  }

  /**
   * Export audit logs to JSON
   */
  async exportLogs(options: {
    startDate?: Date;
    endDate?: Date;
    adminId?: string;
    entityType?: AuditEntityType;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (options.adminId) {
      where.adminId = options.adminId;
    }

    if (options.entityType) {
      where.entityType = options.entityType;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }
}

export const adminAuditService = new AdminAuditService();

// Re-export types for convenience
export { AuditAction, AuditEntityType } from '@prisma/client';
