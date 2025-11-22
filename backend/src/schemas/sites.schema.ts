import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Sites Schemas
 * Centralized Zod validation schemas for site management endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Create site schema
export const createSiteSchema = registry.register(
  'CreateSiteRequest',
  z.object({
    siteUrl: z.string().url('Invalid URL format').openapi({
      description: 'Website URL to crawl',
      example: 'https://example.com',
    }),
    siteName: z.string().min(1, 'Site name is required').optional().openapi({
      description: 'Optional site name',
      example: 'Example Website',
    }),
    siteDescription: z.string().optional().openapi({
      description: 'Optional site description',
      example: 'A website about example products',
    }),
    siteIndustry: z.string().optional().openapi({
      description: 'Optional site industry',
      example: 'E-commerce',
    }),
  }).openapi({
    description: 'Create a new site for chatbot integration',
  })
);

// Update site schema
export const updateSiteSchema = registry.register(
  'UpdateSiteRequest',
  z.object({
    siteName: z.string().min(1, 'Site name cannot be empty').optional().openapi({
      description: 'Site name',
      example: 'Updated Website Name',
    }),
    siteDescription: z.string().optional().openapi({
      description: 'Site description',
      example: 'Updated description',
    }),
    siteIndustry: z.string().optional().openapi({
      description: 'Site industry',
      example: 'Technology',
    }),
    specialInstructions: z.string().optional().openapi({
      description: 'Special instructions for the AI chatbot',
      example: 'Always be friendly and helpful',
    }),
    welcomeMessage: z.string().optional().openapi({
      description: 'Welcome message for visitors',
      example: 'Hello! How can I help you today?',
    }),
  }).openapi({
    description: 'Update site information',
  })
);

// Update starters schema
export const updateStartersSchema = registry.register(
  'UpdateStartersRequest',
  z.object({
    welcomeMessage: z.string().nullable().optional().openapi({
      description: 'Welcome message for the chat widget',
      example: 'Welcome! How can I help you today?',
    }),
    starters: z.array(z.string()).openapi({
      description: 'Array of conversation starter texts',
      example: ['What services do you offer?', 'How can I contact you?', 'Tell me about your products'],
    }),
  }).openapi({
    description: 'Update conversation starters for a site',
  })
);

// Add host schema
export const addHostSchema = registry.register(
  'AddHostRequest',
  z.object({
    hostName: z.string().min(1, 'Hostname is required').openapi({
      description: 'Hostname (e.g., example.com)',
      example: 'example.com',
    }),
    isEnabled: z.boolean().default(true).openapi({
      description: 'Whether the host is enabled',
      example: true,
    }),
  }).openapi({
    description: 'Add an active host for widget deployment',
  })
);

// Update host schema
export const updateHostSchema = registry.register(
  'UpdateHostRequest',
  z.object({
    isEnabled: z.boolean().openapi({
      description: 'Whether the host is enabled',
      example: true,
    }),
  }).openapi({
    description: 'Update host status',
  })
);

// Site params schema
export const siteParamsSchema = z.object({
  siteId: z.string().uuid('Invalid site ID format').openapi({
    description: 'Site unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Host params schema
export const hostParamsSchema = z.object({
  hostId: z.string().uuid('Invalid host ID format').openapi({
    description: 'Host unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});

// Subscription info for site response
const siteSubscriptionSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Subscription ID' }),
  planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).openapi({ description: 'Plan type' }),
  status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']).openapi({ description: 'Subscription status' }),
  trialEndsAt: z.string().nullable().openapi({ description: 'Trial end date' }),
  currentPeriodEnd: z.string().openapi({ description: 'Current period end' }),
}).nullable();

// Site response schemas
export const siteResponseSchema = registry.register(
  'SiteResponse',
  z.object({
    id: z.string().uuid().openapi({ description: 'Site ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
    userId: z.string().uuid().openapi({ description: 'Owner user ID' }),
    siteUrl: z.string().openapi({ description: 'Website URL' }),
    siteName: z.string().openapi({ description: 'Website name' }),
    siteDescription: z.string().nullable().openapi({ description: 'Website description' }),
    siteIndustry: z.string().nullable().openapi({ description: 'Website industry' }),
    specialInstructions: z.string().nullable().openapi({ description: 'AI instructions' }),
    welcomeMessage: z.string().openapi({ description: 'Welcome message' }),
    crawlStatus: z.enum(['PENDING', 'CRAWLING', 'COMPLETED', 'FAILED', 'AWAITING_PAYMENT', 'PROCESSING', 'READY', 'PARTIAL']).openapi({ description: 'Crawl status' }),
    lastCrawledAt: z.string().nullable().openapi({ description: 'Last crawl timestamp' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
    urlCount: z.number().int().optional().openapi({ description: 'Number of URLs crawled' }),
    subscription: siteSubscriptionSchema.optional().openapi({ description: 'Active subscription info' }),
    _count: z.object({
      siteUrls: z.number().int().optional().openapi({ description: 'Number of URLs' }),
      conversations: z.number().int().optional().openapi({ description: 'Number of conversations' }),
      knowledgeFiles: z.number().int().optional().openapi({ description: 'Number of knowledge files' }),
    }).optional().openapi({ description: 'Count aggregates' }),
  }).openapi({
    description: 'Site information',
  })
);

// Starters response schema
export const startersResponseSchema = registry.register(
  'StartersResponse',
  z.object({
    welcomeMessage: z.string().nullable().openapi({ description: 'Welcome message' }),
    starters: z.array(z.object({
      id: z.string().uuid().openapi({ description: 'Starter ID' }),
      starterText: z.string().openapi({ description: 'Starter text' }),
      orderIndex: z.number().int().openapi({ description: 'Display order' }),
      isActive: z.boolean().openapi({ description: 'Is active' }),
    })).openapi({ description: 'Conversation starters' }),
  }).openapi({
    description: 'Conversation starters response',
  })
);

// Host response schema
export const hostResponseSchema = registry.register(
  'HostResponse',
  z.object({
    id: z.string().uuid().openapi({ description: 'Host ID' }),
    siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    hostName: z.string().openapi({ description: 'Hostname' }),
    isEnabled: z.boolean().openapi({ description: 'Is enabled' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
  }).openapi({
    description: 'Active host information',
  })
);

// Hosts list response schema
export const hostsListResponseSchema = registry.register(
  'HostsListResponse',
  z.object({
    hosts: z.array(hostResponseSchema),
  }).openapi({
    description: 'List of active hosts',
  })
);

// Sites list response schema
export const sitesListResponseSchema = registry.register(
  'SitesListResponse',
  z.array(siteResponseSchema).openapi({
    description: 'List of sites',
  })
);

// Message response schema for sites
export const sitesMessageResponseSchema = registry.register(
  'SitesMessageResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
  }).openapi({
    description: 'Simple message response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/sites
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites',
  summary: 'Get all sites for user',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Successfully retrieved sites',
      content: {
        'application/json': {
          schema: sitesListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// POST /api/v1/sites
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites',
  summary: 'Create a new site',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createSiteSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Site created successfully',
      content: {
        'application/json': {
          schema: siteResponseSchema,
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

// GET /api/v1/sites/{siteId}
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}',
  summary: 'Get site by ID',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Successfully retrieved site',
      content: {
        'application/json': {
          schema: siteResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// PATCH /api/v1/sites/{siteId}
registry.registerPath({
  method: 'patch',
  path: '/api/v1/sites/{siteId}',
  summary: 'Update site',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateSiteSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Site updated successfully',
      content: {
        'application/json': {
          schema: siteResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// DELETE /api/v1/sites/{siteId}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/sites/{siteId}',
  summary: 'Delete site',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    204: {
      description: 'Site deleted successfully',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// POST /api/v1/sites/{siteId}/crawl
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/crawl',
  summary: 'Trigger site recrawl',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Crawl initiated successfully',
      content: {
        'application/json': {
          schema: sitesMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/sites/{siteId}/starters
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/starters',
  summary: 'Get conversation starters',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Successfully retrieved starters',
      content: {
        'application/json': {
          schema: startersResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// PUT /api/v1/sites/{siteId}/starters
registry.registerPath({
  method: 'put',
  path: '/api/v1/sites/{siteId}/starters',
  summary: 'Update conversation starters',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateStartersSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Starters updated successfully',
      content: {
        'application/json': {
          schema: startersResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/sites/{siteId}/hosts
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/hosts',
  summary: 'Get active hosts',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Successfully retrieved hosts',
      content: {
        'application/json': {
          schema: hostsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// POST /api/v1/sites/{siteId}/hosts
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/hosts',
  summary: 'Add active host',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: addHostSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Host added successfully',
      content: {
        'application/json': {
          schema: z.object({ host: hostResponseSchema }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// PATCH /api/v1/sites/{siteId}/hosts/{hostId}
registry.registerPath({
  method: 'patch',
  path: '/api/v1/sites/{siteId}/hosts/{hostId}',
  summary: 'Update active host',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      hostId: z.string().uuid().openapi({ description: 'Host ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateHostSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Host updated successfully',
      content: {
        'application/json': {
          schema: z.object({ host: hostResponseSchema }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Host not found',
    },
  },
});

// DELETE /api/v1/sites/{siteId}/hosts/{hostId}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/sites/{siteId}/hosts/{hostId}',
  summary: 'Remove active host',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      hostId: z.string().uuid().openapi({ description: 'Host ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Host removed successfully',
      content: {
        'application/json': {
          schema: sitesMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Host not found',
    },
  },
});

// Type exports
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type UpdateStartersInput = z.infer<typeof updateStartersSchema>;
export type AddHostInput = z.infer<typeof addHostSchema>;
export type UpdateHostInput = z.infer<typeof updateHostSchema>;
export type SiteParams = z.infer<typeof siteParamsSchema>;
export type HostParams = z.infer<typeof hostParamsSchema>;
