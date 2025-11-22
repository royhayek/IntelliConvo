/**
 * Admin Audit Middleware
 * Automatically logs admin actions for security and compliance
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuditService } from '../services/admin';
import { AuditAction, AuditEntityType } from '@prisma/client';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
}

/**
 * Map HTTP methods and paths to audit actions and entity types
 */
const getAuditInfo = (method: string, path: string): {
  action: AuditAction | null;
  entityType: AuditEntityType | null;
} => {
  // Extract the base path after /admin/
  const pathParts = path.replace('/api/v1/admin/', '').split('/');
  const resource = pathParts[0];

  // Map resources to entity types
  const entityTypeMap: Record<string, AuditEntityType> = {
    users: AuditEntityType.USER,
    sites: AuditEntityType.SITE,
    urls: AuditEntityType.URL,
    embeddings: AuditEntityType.EMBEDDING,
    files: AuditEntityType.FILE,
    conversations: AuditEntityType.CONVERSATION,
    messages: AuditEntityType.MESSAGE,
    subscriptions: AuditEntityType.SUBSCRIPTION,
    billing: AuditEntityType.TRANSACTION,
    sessions: AuditEntityType.SESSION,
    widgets: AuditEntityType.WIDGET,
  };

  const entityType = entityTypeMap[resource] || null;

  // Map methods to actions
  let action: AuditAction | null = null;

  switch (method.toUpperCase()) {
    case 'GET':
      // Only log significant GET operations, not list views
      if (pathParts.length > 1 && pathParts[1] !== '') {
        action = AuditAction.VIEW;
      }
      break;
    case 'POST':
      // Check for special actions
      if (path.includes('/recrawl')) {
        action = AuditAction.RECRAWL;
      } else if (path.includes('/reprocess')) {
        action = AuditAction.REPROCESS;
      } else if (path.includes('/cleanup')) {
        action = AuditAction.CLEANUP;
      } else if (path.includes('/force-logout')) {
        action = AuditAction.FORCE_LOGOUT;
      } else if (path.includes('/extend-trial')) {
        action = AuditAction.EXTEND_TRIAL;
      } else if (path.includes('/bulk')) {
        action = AuditAction.BULK_UPDATE;
      } else {
        action = AuditAction.CREATE;
      }
      break;
    case 'PUT':
    case 'PATCH':
      if (path.includes('/bulk')) {
        action = AuditAction.BULK_UPDATE;
      } else {
        action = AuditAction.UPDATE;
      }
      break;
    case 'DELETE':
      if (path.includes('/bulk')) {
        action = AuditAction.BULK_DELETE;
      } else {
        action = AuditAction.DELETE;
      }
      break;
  }

  return { action, entityType };
};

/**
 * Extract entity ID from request params or path
 */
const getEntityId = (req: Request): string | undefined => {
  // Check common param patterns
  const idParams = [
    'id', 'userId', 'siteId', 'urlId', 'fileId',
    'embeddingId', 'conversationId', 'messageId',
    'subscriptionId', 'transactionId', 'sessionId', 'widgetId',
  ];

  for (const param of idParams) {
    if (req.params[param]) {
      return req.params[param];
    }
  }

  return undefined;
};

/**
 * Middleware to automatically log admin actions
 * Should be used after authentication middleware
 */
export const auditAdminAction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip if not authenticated or not admin
  if (!req.user?.id || !req.user?.email) {
    return next();
  }

  // Skip audit log endpoints to avoid recursion
  if (req.path.includes('/audit')) {
    return next();
  }

  // Skip stats endpoints (too noisy)
  if (req.path.includes('/stats')) {
    return next();
  }

  const { action, entityType } = getAuditInfo(req.method, req.path);

  // Skip if we couldn't determine action or entity type
  if (!action || !entityType) {
    return next();
  }

  // Skip VIEW actions to reduce noise (can be enabled if needed)
  if (action === AuditAction.VIEW) {
    return next();
  }

  const entityId = getEntityId(req);
  const startTime = Date.now();

  // Use res.on('finish') to log after response is sent
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;

    // Log the action asynchronously (don't block response)
    adminAuditService.log({
      adminId: req.user!.id,
      adminEmail: req.user!.email,
      action,
      entityType,
      entityId,
      oldValues: undefined, // Would need to be populated by the route handler
      newValues: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode: res.statusCode,
        responseTime,
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      success,
      errorMessage: !success ? `HTTP ${res.statusCode}` : undefined,
    }).catch((error) => {
      console.error('Failed to log audit:', error);
    });
  });

  next();
};

/**
 * Helper function to manually log an audit action with full context
 * Use this in route handlers when you need to capture old/new values
 */
export const logAuditAction = async (
  req: AuthenticatedRequest,
  action: AuditAction,
  entityType: AuditEntityType,
  options: {
    entityId?: string;
    entityName?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }
) => {
  if (!req.user?.id || !req.user?.email) {
    console.error('Cannot log audit: no user in request');
    return;
  }

  await adminAuditService.log({
    adminId: req.user.id,
    adminEmail: req.user.email,
    action,
    entityType,
    entityId: options.entityId,
    entityName: options.entityName,
    oldValues: options.oldValues,
    newValues: options.newValues,
    metadata: options.metadata,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
    userAgent: req.headers['user-agent'],
    success: options.success ?? true,
    errorMessage: options.errorMessage,
  });
};

export default auditAdminAction;
