/**
 * Admin Audit Routes
 * Routes for viewing audit logs and statistics
 */

import { Router, Request, Response, NextFunction } from 'express';
import { adminAuditService } from '../../services/admin';
import { AuditAction, AuditEntityType } from '@prisma/client';

const router = Router();

/**
 * GET /api/v1/admin/audit
 * Get paginated list of audit logs
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '50',
      adminId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      success,
      sortOrder = 'desc',
    } = req.query;

    const result = await adminAuditService.getAuditLogs({
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100), // Max 100
      adminId: adminId as string,
      action: action as AuditAction,
      entityType: entityType as AuditEntityType,
      entityId: entityId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      success: success !== undefined ? success === 'true' : undefined,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/audit/stats
 * Get audit statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminAuditService.getAuditStats();
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/audit/entity/:entityType/:entityId
 * Get audit history for a specific entity
 */
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.params;

    // Validate entityType
    if (!Object.values(AuditEntityType).includes(entityType as AuditEntityType)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    const history = await adminAuditService.getEntityHistory(
      entityType as AuditEntityType,
      entityId
    );

    res.json({ data: history });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/audit/:id
 * Get a single audit log by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await adminAuditService.getAuditLogById(id);

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ data: log });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/audit/export
 * Export audit logs
 */
router.get('/export/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      adminId,
      entityType,
      format = 'json',
    } = req.query;

    const logs = await adminAuditService.exportLogs({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      adminId: adminId as string,
      entityType: entityType as AuditEntityType,
    });

    // Log this export action
    await adminAuditService.logWithRequest(req as never, {
      action: AuditAction.EXPORT,
      entityType: AuditEntityType.USER, // Using USER as a generic type for audit exports
      metadata: {
        exportType: 'audit_logs',
        recordCount: logs.length,
        startDate: startDate as string,
        endDate: endDate as string,
      },
    });

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'id', 'adminEmail', 'action', 'entityType', 'entityId', 'entityName',
        'success', 'errorMessage', 'ipAddress', 'createdAt',
      ];
      const csv = [
        headers.join(','),
        ...logs.map((log) => [
          log.id,
          log.adminEmail,
          log.action,
          log.entityType,
          log.entityId || '',
          log.entityName || '',
          log.success,
          log.errorMessage || '',
          log.ipAddress || '',
          log.createdAt.toISOString(),
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/audit/cleanup
 * Clean up old audit logs (admin only)
 */
router.post('/cleanup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { retentionDays = 365 } = req.body;

    // Log cleanup action before performing it
    await adminAuditService.logWithRequest(req as never, {
      action: AuditAction.CLEANUP,
      entityType: AuditEntityType.USER, // Using USER as a generic type for audit cleanup
      metadata: { retentionDays },
    });

    const result = await adminAuditService.cleanupOldLogs(retentionDays);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
