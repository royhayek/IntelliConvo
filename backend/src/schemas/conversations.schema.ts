import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Conversations & Messages Schemas
 * Centralized Zod validation schemas for conversation endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Conversation query schema
export const conversationQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().openapi({
    description: 'Page number for pagination',
    example: '1',
  }),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().openapi({
    description: 'Number of items per page (max 100)',
    example: '20',
  }),
  search: z.string().optional().openapi({
    description: 'Search query for conversations',
    example: 'help',
  }),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().openapi({
    description: 'Start date filter (ISO 8601 or YYYY-MM-DD)',
    example: '2024-01-01',
  }),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().openapi({
    description: 'End date filter (ISO 8601 or YYYY-MM-DD)',
    example: '2024-12-31',
  }),
  siteId: z.string().uuid('Invalid site ID format').optional().openapi({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Message search schema
export const messageSearchSchema = registry.register(
  'MessageSearchRequest',
  z.object({
    query: z.string().min(1, 'Search query is required').openapi({
      description: 'Search query for messages',
      example: 'product pricing',
    }),
    siteId: z.string().uuid('Invalid site ID format').optional().openapi({
      description: 'Filter by site ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().openapi({
      description: 'Maximum number of results (max 100)',
      example: '50',
    }),
  }).openapi({
    description: 'Search messages across conversations',
  })
);

// Conversation params schema
export const conversationParamsSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format').openapi({
    description: 'Conversation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Analytics query schema
export const analyticsQuerySchema = z.object({
  siteId: z.string().uuid('Invalid site ID format').optional().openapi({
    description: 'Filter analytics by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d').openapi({
    description: 'Time period for analytics',
    example: '30d',
  }),
});

// Conversation response schemas
export const conversationSchema = registry.register(
  'Conversation',
  z.object({
    id: z.string().uuid().openapi({ description: 'Conversation ID' }),
    siteId: z.string().uuid().openapi({ description: 'Associated site ID' }),
    sessionId: z.string().openapi({ description: 'Session identifier' }),
    userIdentifier: z.string().nullable().openapi({ description: 'User identifier' }),
    userAgent: z.string().nullable().openapi({ description: 'User agent string' }),
    ipAddress: z.string().nullable().openapi({ description: 'User IP address' }),
    startedAt: z.string().openapi({ description: 'Conversation start timestamp' }),
    lastMessageAt: z.string().openapi({ description: 'Last message timestamp' }),
    messageCount: z.number().int().openapi({ description: 'Number of messages' }),
  }).openapi({
    description: 'Conversation information',
  })
);

export const messageSchema = registry.register(
  'Message',
  z.object({
    id: z.string().uuid().openapi({ description: 'Message ID' }),
    conversationId: z.string().uuid().openapi({ description: 'Associated conversation ID' }),
    role: z.enum(['USER', 'ASSISTANT']).openapi({ description: 'Message sender role' }),
    content: z.string().openapi({ description: 'Message content' }),
    timestamp: z.string().openapi({ description: 'Message timestamp' }),
    tokensUsed: z.number().int().nullable().openapi({ description: 'Number of tokens used' }),
    costInCents: z.number().nullable().openapi({ description: 'Cost in cents' }),
  }).openapi({
    description: 'Message information',
  })
);

export const conversationAnalyticsSchema = registry.register(
  'ConversationAnalytics',
  z.object({
    overview: z.object({
      totalConversations: z.number().int().openapi({ description: 'Total number of conversations' }),
      totalMessages: z.number().int().openapi({ description: 'Total number of messages' }),
      averageMessagesPerConversation: z.number().openapi({ description: 'Average messages per conversation' }),
      activeUsers: z.number().int().openapi({ description: 'Number of active users' }),
    }).openapi({ description: 'Overview statistics' }),
    timeSeriesData: z.array(
      z.object({
        date: z.string().openapi({ description: 'Date' }),
        conversations: z.number().int().openapi({ description: 'Conversations count' }),
        messages: z.number().int().openapi({ description: 'Messages count' }),
      })
    ).openapi({ description: 'Time series data' }),
    topSites: z.array(
      z.object({
        siteId: z.string().openapi({ description: 'Site ID' }),
        siteName: z.string().openapi({ description: 'Site name' }),
        conversationCount: z.number().int().openapi({ description: 'Conversations count' }),
        messageCount: z.number().int().openapi({ description: 'Messages count' }),
      })
    ).openapi({ description: 'Top sites by activity' }),
  }).openapi({
    description: 'Conversation analytics data',
  })
);

// Conversations list response schema
export const conversationsListResponseSchema = registry.register(
  'ConversationsListResponse',
  z.object({
    conversations: z.array(conversationSchema).openapi({ description: 'List of conversations' }),
    pagination: z.object({
      page: z.number().int().openapi({ description: 'Current page' }),
      limit: z.number().int().openapi({ description: 'Items per page' }),
      total: z.number().int().openapi({ description: 'Total items' }),
      totalPages: z.number().int().openapi({ description: 'Total pages' }),
    }).openapi({ description: 'Pagination info' }),
  }).openapi({
    description: 'Conversations list response',
  })
);

// Conversation details response schema
export const conversationDetailsResponseSchema = registry.register(
  'ConversationDetailsResponse',
  z.object({
    id: z.string().uuid().openapi({ description: 'Conversation ID' }),
    site: z.object({
      id: z.string().uuid().openapi({ description: 'Site ID' }),
      siteName: z.string().openapi({ description: 'Site name' }),
    }).openapi({ description: 'Site info' }),
    sessionId: z.string().openapi({ description: 'Session ID' }),
    userIdentifier: z.string().nullable().optional().openapi({ description: 'User identifier' }),
    startedAt: z.string().openapi({ description: 'Start timestamp' }),
    lastMessageAt: z.string().openapi({ description: 'Last message timestamp' }),
    messageCount: z.number().int().optional().openapi({ description: 'Number of messages' }),
    messages: z.array(messageSchema).openapi({ description: 'Conversation messages' }),
  }).openapi({
    description: 'Conversation details with messages',
  })
);

// Message search response schema
export const messageSearchResponseSchema = registry.register(
  'MessageSearchResponse',
  z.object({
    messages: z.array(z.object({
      id: z.string().uuid().openapi({ description: 'Message ID' }),
      content: z.string().openapi({ description: 'Message content' }),
      role: z.enum(['USER', 'ASSISTANT']).openapi({ description: 'Message role' }),
      timestamp: z.string().openapi({ description: 'Timestamp' }),
      conversation: z.object({
        id: z.string().uuid().openapi({ description: 'Conversation ID' }),
        sessionId: z.string().optional().openapi({ description: 'Session ID' }),
        site: z.object({
          id: z.string().uuid().openapi({ description: 'Site ID' }),
          siteName: z.string().openapi({ description: 'Site name' }),
        }).openapi({ description: 'Site info' }),
      }).openapi({ description: 'Parent conversation' }),
    })).openapi({ description: 'Search results' }),
    total: z.number().int().openapi({ description: 'Total results' }),
  }).openapi({
    description: 'Message search response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/conversations
registry.registerPath({
  method: 'get',
  path: '/api/v1/conversations',
  summary: 'Get conversations with filtering and pagination',
  tags: ['Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    query: conversationQuerySchema,
  },
  responses: {
    200: {
      description: 'Conversations retrieved successfully',
      content: {
        'application/json': {
          schema: conversationsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/v1/conversations/analytics
registry.registerPath({
  method: 'get',
  path: '/api/v1/conversations/analytics',
  summary: 'Get conversation analytics',
  tags: ['Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    query: analyticsQuerySchema,
  },
  responses: {
    200: {
      description: 'Analytics retrieved successfully',
      content: {
        'application/json': {
          schema: conversationAnalyticsSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// GET /api/v1/conversations/search
registry.registerPath({
  method: 'get',
  path: '/api/v1/conversations/search',
  summary: 'Search messages across conversations',
  tags: ['Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    query: messageSearchSchema,
  },
  responses: {
    200: {
      description: 'Search results retrieved successfully',
      content: {
        'application/json': {
          schema: messageSearchResponseSchema,
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

// GET /api/v1/conversations/{conversationId}
registry.registerPath({
  method: 'get',
  path: '/api/v1/conversations/{conversationId}',
  summary: 'Get conversation details with messages',
  tags: ['Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    params: conversationParamsSchema,
  },
  responses: {
    200: {
      description: 'Conversation retrieved successfully',
      content: {
        'application/json': {
          schema: conversationDetailsResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Conversation not found',
    },
  },
});

// Type exports
export type ConversationQuery = z.infer<typeof conversationQuerySchema>;
export type MessageSearch = z.infer<typeof messageSearchSchema>;
export type ConversationParams = z.infer<typeof conversationParamsSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
