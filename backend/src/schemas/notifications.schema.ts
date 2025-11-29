import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Notification Schemas
 * Centralized Zod validation schemas for notification endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Response Schemas
// ============================================

// Notification type enum
export const notificationTypeSchema = z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).openapi({
  description: 'Type of notification',
});

// Single notification schema
export const notificationSchema = registry.register(
  'Notification',
  z.object({
    id: z.string().uuid().openapi({ description: 'Notification ID' }),
    type: notificationTypeSchema,
    title: z.string().openapi({ description: 'Notification title' }),
    message: z.string().openapi({ description: 'Notification message' }),
    link: z.string().nullable().openapi({ description: 'Optional link to navigate to' }),
    siteId: z.string().uuid().nullable().openapi({ description: 'Related site ID if applicable' }),
    isRead: z.boolean().openapi({ description: 'Whether the notification has been read' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    readAt: z.string().nullable().openapi({ description: 'Read timestamp' }),
  }).openapi({
    description: 'User notification',
  })
);

// Notification list response schema
export const notificationListResponseSchema = registry.register(
  'NotificationListResponse',
  z.object({
    notifications: z.array(notificationSchema).openapi({ description: 'List of notifications' }),
    unreadCount: z.number().int().openapi({ description: 'Number of unread notifications' }),
  }).openapi({
    description: 'List of notifications with unread count',
  })
);

// Unread count response schema
export const unreadCountResponseSchema = registry.register(
  'UnreadCountResponse',
  z.object({
    unreadCount: z.number().int().openapi({ description: 'Number of unread notifications' }),
  }).openapi({
    description: 'Unread notification count',
  })
);

// Message response schema
export const notificationMessageResponseSchema = registry.register(
  'NotificationMessageResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
  }).openapi({
    description: 'Simple message response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/notifications
registry.registerPath({
  method: 'get',
  path: '/notifications',
  summary: 'Get user notifications',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().optional().openapi({
        description: 'Maximum number of notifications to return',
        example: '50',
      }),
    }),
  },
  responses: {
    200: {
      description: 'List of notifications',
      content: {
        'application/json': {
          schema: notificationListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/v1/notifications/unread-count
registry.registerPath({
  method: 'get',
  path: '/notifications/unread-count',
  summary: 'Get unread notification count',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Unread count',
      content: {
        'application/json': {
          schema: unreadCountResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// PATCH /api/v1/notifications/{notificationId}/read
registry.registerPath({
  method: 'patch',
  path: '/notifications/{notificationId}/read',
  summary: 'Mark a notification as read',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      notificationId: z.string().uuid().openapi({ description: 'Notification ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Updated notification',
      content: {
        'application/json': {
          schema: notificationSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Notification not found',
    },
  },
});

// PATCH /api/v1/notifications/read-all
registry.registerPath({
  method: 'patch',
  path: '/notifications/read-all',
  summary: 'Mark all notifications as read',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: notificationMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// DELETE /api/v1/notifications/{notificationId}
registry.registerPath({
  method: 'delete',
  path: '/notifications/{notificationId}',
  summary: 'Delete a notification',
  tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      notificationId: z.string().uuid().openapi({ description: 'Notification ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Notification deleted',
      content: {
        'application/json': {
          schema: notificationMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Notification not found',
    },
  },
});

// Type exports
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
