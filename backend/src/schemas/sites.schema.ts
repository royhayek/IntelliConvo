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
    startersHeadline: z.string().optional().openapi({
      description: 'Headline text displayed above conversation starter buttons',
      example: 'How can I help you today?',
    }),
  }).openapi({
    description: 'Update site information',
  })
);

// Update starters schema
export const updateStartersSchema = registry.register(
  'UpdateStartersRequest',
  z.object({
    startersHeadline: z.string().nullable().optional().openapi({
      description: 'Headline text displayed above conversation starter buttons',
      example: 'How can I help you today?',
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
      description: 'Hostname or pattern for allowed widget origins. Supports: regular domains (example.com), wildcards (*.example.com), localhost with ports (localhost:3000), and IP addresses with ports (192.168.1.1:8080)',
      example: 'example.com',
    }),
    isEnabled: z.boolean().default(true).openapi({
      description: 'Whether the host is enabled',
      example: true,
    }),
  }).openapi({
    description: 'Add an active host for widget deployment. The hostname can be a regular domain, wildcard pattern, localhost with port, or IP address with port.',
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
  cancelAtPeriodEnd: z.boolean().openapi({ description: 'Whether subscription is scheduled to cancel at period end' }),
}).nullable();

// Site response schemas
export const siteResponseSchema = registry.register(
  'SiteResponse',
  z.object({
    id: z.string().uuid().openapi({ description: 'Site ID', example: '123e4567-e89b-12d3-a456-426614174000' }),
    userId: z.string().uuid().openapi({ description: 'Owner user ID' }),
    siteUrl: z.string().openapi({ description: 'Website URL' }),
    siteName: z.string().openapi({ description: 'Website name' }),
    faviconUrl: z.string().nullable().openapi({ description: 'Website favicon URL' }),
    siteDescription: z.string().nullable().openapi({ description: 'Website description' }),
    siteIndustry: z.string().nullable().openapi({ description: 'Website industry' }),
    specialInstructions: z.string().nullable().openapi({ description: 'AI instructions' }),
    startersHeadline: z.string().openapi({ description: 'Headline for conversation starters' }),
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
    startersHeadline: z.string().nullable().openapi({ description: 'Headline for conversation starters' }),
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

// ============================================
// URL Discovery Schemas
// ============================================

// Discovered URL schema
export const discoveredUrlSchema = z.object({
  url: z.string().url().openapi({ description: 'Page URL' }),
  title: z.string().nullable().optional().openapi({ description: 'Page title if available' }),
  source: z.enum(['sitemap', 'discovery', 'manual']).openapi({ description: 'How the URL was discovered' }),
  category: z.enum(['homepage', 'product', 'blog', 'about', 'support', 'other']).openapi({ description: 'Page category' }),
  priority: z.enum(['high', 'medium', 'low']).openapi({ description: 'Crawl priority' }),
  suggested: z.boolean().openapi({ description: 'Whether this URL is suggested for crawling' }),
});

// Discovery result response schema
export const discoveryResultSchema = registry.register(
  'DiscoveryResult',
  z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).openapi({ description: 'Discovery status' }),
    urls: z.array(discoveredUrlSchema).openapi({ description: 'Discovered URLs' }),
    sitemapFound: z.boolean().openapi({ description: 'Whether a sitemap was found' }),
    sitemapUrl: z.string().nullable().optional().openapi({ description: 'Sitemap URL if found' }),
    totalCount: z.number().int().openapi({ description: 'Total number of discovered URLs' }),
    selectedCount: z.number().int().openapi({ description: 'Number of selected URLs' }),
    estimatedCrawlTime: z.number().int().openapi({ description: 'Estimated crawl time in seconds' }),
  }).openapi({
    description: 'URL discovery results',
  })
);

// Update URL selections schema
export const updateSelectionsSchema = registry.register(
  'UpdateSelectionsRequest',
  z.object({
    selections: z.array(z.object({
      url: z.string().url().openapi({ description: 'URL to update' }),
      selected: z.boolean().openapi({ description: 'Whether to include in crawl' }),
    })).openapi({ description: 'URL selection updates' }),
  }).openapi({
    description: 'Update URL selections for crawling',
  })
);

// Bulk select/deselect schema
export const bulkSelectSchema = registry.register(
  'BulkSelectRequest',
  z.object({
    action: z.enum(['select', 'deselect']).openapi({ description: 'Action to perform' }),
    category: z.enum(['homepage', 'product', 'blog', 'about', 'support', 'other', 'all']).optional().openapi({ description: 'Category to apply action to' }),
    priority: z.enum(['high', 'medium', 'low', 'all']).optional().openapi({ description: 'Priority to apply action to' }),
  }).openapi({
    description: 'Bulk select/deselect URLs by category or priority',
  })
);

// Add manual URLs schema
export const addManualUrlsSchema = registry.register(
  'AddManualUrlsRequest',
  z.object({
    urls: z.array(z.string()).min(1, 'At least one URL is required').openapi({
      description: 'URLs to add manually',
      example: ['https://example.com/page1', 'https://example.com/page2'],
    }),
  }).openapi({
    description: 'Add URLs manually for crawling',
  })
);

// Discovery stats response schema
export const discoveryStatsSchema = registry.register(
  'DiscoveryStats',
  z.object({
    byCategory: z.record(z.object({
      total: z.number().int(),
      selected: z.number().int(),
    })).openapi({ description: 'Stats by category' }),
    byPriority: z.record(z.object({
      total: z.number().int(),
      selected: z.number().int(),
    })).openapi({ description: 'Stats by priority' }),
  }).openapi({
    description: 'Discovery statistics',
  })
);

// Selections update response schema
export const selectionsUpdateResponseSchema = registry.register(
  'SelectionsUpdateResponse',
  z.object({
    selectedCount: z.number().int().openapi({ description: 'Number of selected URLs' }),
    estimatedCrawlTime: z.number().int().openapi({ description: 'Estimated crawl time in seconds' }),
  }).openapi({
    description: 'Response after updating URL selections',
  })
);

// Selective crawl request schema
export const selectiveCrawlSchema = registry.register(
  'SelectiveCrawlRequest',
  z.object({
    mode: z.enum(['selective', 'full']).default('selective').openapi({
      description: 'Crawl mode: selective (only selected URLs) or full (all discovered URLs)',
    }),
    urls: z.array(z.string().min(1)).optional().openapi({
      description: 'Optional array of URLs to crawl. If provided, these URLs will be used instead of reading from database selections. This ensures the crawled URLs match exactly what the user selected in the UI.',
    }),
  }).openapi({
    description: 'Start crawling with selected URLs',
  })
);

// ============================================
// Discovery Path Registrations
// ============================================

// POST /api/v1/sites/{siteId}/discover - Start URL discovery
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/discover',
  summary: 'Start URL discovery',
  description: 'Discovers URLs from sitemap or homepage without crawling content. This is fast (~30 seconds).',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Discovery started',
      content: {
        'application/json': {
          schema: sitesMessageResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// GET /api/v1/sites/{siteId}/discovery - Get discovery results
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/discovery',
  summary: 'Get discovery results',
  description: 'Returns discovered URLs with their categories and selection status.',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Discovery results',
      content: {
        'application/json': {
          schema: discoveryResultSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// GET /api/v1/sites/{siteId}/discovery/stats - Get discovery statistics
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/discovery/stats',
  summary: 'Get discovery statistics',
  description: 'Returns statistics about discovered URLs by category and priority.',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
  },
  responses: {
    200: {
      description: 'Discovery statistics',
      content: {
        'application/json': {
          schema: discoveryStatsSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// PUT /api/v1/sites/{siteId}/discovery/selections - Update URL selections
registry.registerPath({
  method: 'put',
  path: '/api/v1/sites/{siteId}/discovery/selections',
  summary: 'Update URL selections',
  description: 'Update which URLs should be included in the crawl.',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateSelectionsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Selections updated',
      content: {
        'application/json': {
          schema: selectionsUpdateResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// POST /api/v1/sites/{siteId}/discovery/bulk-select - Bulk select/deselect URLs
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/discovery/bulk-select',
  summary: 'Bulk select/deselect URLs',
  description: 'Select or deselect all URLs matching a category or priority.',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: bulkSelectSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Bulk selection completed',
      content: {
        'application/json': {
          schema: selectionsUpdateResponseSchema,
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// POST /api/v1/sites/{siteId}/discovery/manual-urls - Add manual URLs
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/discovery/manual-urls',
  summary: 'Add manual URLs',
  description: 'Add URLs manually that were not found in sitemap or discovery.',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: addManualUrlsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'URLs added',
      content: {
        'application/json': {
          schema: z.object({
            added: z.array(discoveredUrlSchema),
            count: z.number().int(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// POST /api/v1/sites/{siteId}/crawl/selective - Start selective crawl
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/crawl/selective',
  summary: 'Start selective crawl',
  description: 'Crawl only the selected URLs from discovery.',
  tags: ['Sites', 'Discovery'],
  security: [{ bearerAuth: [] }],
  request: {
    params: siteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: selectiveCrawlSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Crawl started',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            urlCount: z.number().int(),
            estimatedTime: z.number().int(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
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
export type UpdateSelectionsInput = z.infer<typeof updateSelectionsSchema>;
export type BulkSelectInput = z.infer<typeof bulkSelectSchema>;
export type AddManualUrlsInput = z.infer<typeof addManualUrlsSchema>;
export type SelectiveCrawlInput = z.infer<typeof selectiveCrawlSchema>;
