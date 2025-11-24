import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Site URLs Schemas
 * Centralized Zod validation schemas for URL management endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// URL query schema
export const urlQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().openapi({
    description: 'Page number for pagination',
    example: '1',
  }),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().openapi({
    description: 'Number of items per page (max 100)',
    example: '20',
  }),
  search: z.string().optional().openapi({
    description: 'Search query for URLs',
    example: 'products',
  }),
  isActive: z.enum(['true', 'false']).optional().openapi({
    description: 'Filter by active status',
    example: 'true',
  }),
  isExcluded: z.enum(['true', 'false']).optional().openapi({
    description: 'Filter by exclusion status',
    example: 'false',
  }),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional().openapi({
    description: 'Filter by processing status',
    example: 'completed',
  }),
});

// URL params schema
export const urlParamsSchema = z.object({
  siteId: z.string().uuid('Invalid site ID format').openapi({
    description: 'Site unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  urlId: z.string().uuid('Invalid URL ID format').optional().openapi({
    description: 'URL unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});

// Update URL schema
export const updateUrlSchema = registry.register(
  'UpdateUrlRequest',
  z.object({
    isActive: z.boolean().optional().openapi({
      description: 'Whether URL is active',
      example: true,
    }),
    isExcluded: z.boolean().optional().openapi({
      description: 'Whether URL is excluded from training',
      example: false,
    }),
  }).openapi({
    description: 'Update URL status',
  })
);

// Bulk update URLs schema
export const bulkUpdateUrlsSchema = registry.register(
  'BulkUpdateUrlsRequest',
  z.object({
    urlIds: z.array(z.string().uuid('Invalid URL ID format')).min(1, 'At least one URL ID required').openapi({
      description: 'Array of URL IDs to update',
      example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    }),
    isActive: z.boolean().optional().openapi({
      description: 'Set active status',
      example: true,
    }),
    isExcluded: z.boolean().optional().openapi({
      description: 'Set exclusion status',
      example: false,
    }),
  }).openapi({
    description: 'Bulk update multiple URLs',
  })
);

// Add URLs schema
export const addUrlsSchema = registry.register(
  'AddUrlsRequest',
  z.object({
    urls: z.array(z.string().url('Invalid URL format')).min(1, 'At least one URL required').openapi({
      description: 'Array of URLs to add',
      example: ['https://example.com/page1', 'https://example.com/page2'],
    }),
  }).openapi({
    description: 'Add multiple URLs to a site',
  })
);

// Update URL content schema
export const updateContentSchema = registry.register(
  'UpdateContentRequest',
  z
    .object({
      content: z.string().min(1, 'Content cannot be empty').optional().openapi({
        description: 'Plain text content',
        example: 'This is the page content...',
      }),
      htmlContent: z.string().min(1, 'HTML content cannot be empty').optional().openapi({
        description: 'HTML content for rich preview',
        example: '<div>This is the page content...</div>',
      }),
    })
    .refine((data) => data.content || data.htmlContent, {
      message: 'Either content or htmlContent must be provided',
    })
    .openapi({
      description: 'Update URL content',
    })
);

// URL embedding status enum
export const urlEmbeddingStatusEnum = z.enum([
  'SCRAPED',
  'PENDING',
  'PROCESSING',
  'READY',
  'FAILED',
  'EXCLUDED',
]).openapi({
  description: 'URL embedding status',
});

// URL response schema
export const siteUrlSchema = registry.register(
  'SiteUrl',
  z.object({
    id: z.string().uuid().openapi({ description: 'URL ID' }),
    siteId: z.string().uuid().openapi({ description: 'Associated site ID' }),
    url: z.string().openapi({ description: 'The crawled URL' }),
    title: z.string().nullable().openapi({ description: 'Page title' }),
    content: z.string().nullable().openapi({ description: 'Extracted page content' }),
    htmlContent: z.string().nullable().openapi({ description: 'Cleaned HTML' }),
    isActive: z.boolean().openapi({ description: 'Whether URL is active' }),
    isExcluded: z.boolean().openapi({ description: 'Whether URL is excluded from training' }),
    embeddingStatus: urlEmbeddingStatusEnum.openapi({ description: 'Current embedding status' }),
    lastCrawledAt: z.string().nullable().openapi({ description: 'Last crawl timestamp' }),
    contentHash: z.string().nullable().openapi({ description: 'Content hash for change detection' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
    embeddingsCount: z.number().int().optional().openapi({ description: 'Number of embeddings for this URL' }),
  }).openapi({
    description: 'Site URL information',
  })
);

// URLs list response schema
export const urlsListResponseSchema = registry.register(
  'UrlsListResponse',
  z.array(siteUrlSchema).openapi({
    description: 'List of site URLs',
  })
);

// Add URLs response schema
export const addUrlsResponseSchema = registry.register(
  'AddUrlsResponse',
  z.object({
    added: z.number().int().openapi({ description: 'Number of URLs added' }),
    urls: z.array(siteUrlSchema).openapi({ description: 'Added URLs' }),
  }).openapi({
    description: 'Add URLs response',
  })
);

// URL message response schema
export const urlMessageResponseSchema = registry.register(
  'UrlMessageResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
  }).openapi({
    description: 'Simple message response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/sites/{siteId}/urls
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/urls',
  summary: 'Get site URLs',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    }),
    query: z.object({
      search: z.string().optional().openapi({ description: 'Search query' }),
      status: z.enum(['active', 'excluded']).optional().openapi({ description: 'Filter by status' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved URLs',
      content: {
        'application/json': {
          schema: urlsListResponseSchema,
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

// POST /api/v1/sites/{siteId}/urls
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/urls',
  summary: 'Add new URLs',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: addUrlsSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'URLs added successfully',
      content: {
        'application/json': {
          schema: addUrlsResponseSchema,
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

// GET /api/v1/sites/{siteId}/urls/{urlId}
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/urls/{urlId}',
  summary: 'Get single URL details',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      urlId: z.string().uuid().openapi({ description: 'URL ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved URL',
      content: {
        'application/json': {
          schema: siteUrlSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'URL not found',
    },
  },
});

// PATCH /api/v1/sites/{siteId}/urls/{urlId}
registry.registerPath({
  method: 'patch',
  path: '/api/v1/sites/{siteId}/urls/{urlId}',
  summary: 'Update URL settings',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      urlId: z.string().uuid().openapi({ description: 'URL ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateUrlSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'URL updated successfully',
      content: {
        'application/json': {
          schema: siteUrlSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'URL not found',
    },
  },
});

// DELETE /api/v1/sites/{siteId}/urls/{urlId}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/sites/{siteId}/urls/{urlId}',
  summary: 'Delete URL',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      urlId: z.string().uuid().openapi({ description: 'URL ID' }),
    }),
  },
  responses: {
    200: {
      description: 'URL deleted successfully',
      content: {
        'application/json': {
          schema: urlMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'URL not found',
    },
  },
});

// PUT /api/v1/sites/{siteId}/urls/{urlId}/content
registry.registerPath({
  method: 'put',
  path: '/api/v1/sites/{siteId}/urls/{urlId}/content',
  summary: 'Update URL content',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      urlId: z.string().uuid().openapi({ description: 'URL ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateContentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Content updated successfully',
      content: {
        'application/json': {
          schema: siteUrlSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'URL not found',
    },
  },
});

// POST /api/v1/sites/{siteId}/urls/{urlId}/crawl
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/urls/{urlId}/crawl',
  summary: 'Trigger URL recrawl',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      urlId: z.string().uuid().openapi({ description: 'URL ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Crawl initiated successfully',
      content: {
        'application/json': {
          schema: urlMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'URL not found',
    },
  },
});

// ============================================
// Retry Schemas and Paths
// ============================================

// Failed URL response schema
export const failedUrlSchema = registry.register(
  'FailedUrl',
  z.object({
    id: z.string().uuid().openapi({ description: 'URL ID' }),
    url: z.string().openapi({ description: 'The URL' }),
    lastError: z.string().nullable().openapi({ description: 'Last error message' }),
    retryCount: z.number().int().openapi({ description: 'Number of retry attempts' }),
    lastRetryAt: z.string().nullable().openapi({ description: 'Last retry timestamp' }),
  }).openapi({
    description: 'Failed URL with error details',
  })
);

// Failed URLs response schema
export const failedUrlsResponseSchema = registry.register(
  'FailedUrlsResponse',
  z.object({
    urls: z.array(failedUrlSchema).openapi({ description: 'List of failed URLs' }),
    totalFailed: z.number().int().openapi({ description: 'Total count of failed URLs' }),
  }).openapi({
    description: 'Failed URLs response',
  })
);

// Retry response schema
export const retryResponseSchema = registry.register(
  'RetryResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
    retriedCount: z.number().int().openapi({ description: 'Number of URLs queued for retry' }),
    skippedCount: z.number().int().openapi({ description: 'Number of URLs skipped (exceeded max retries)' }),
  }).openapi({
    description: 'Retry operation response',
  })
);

// GET /api/v1/sites/{siteId}/urls/failed
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/urls/failed',
  summary: 'Get failed URLs with error details',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Failed URLs retrieved successfully',
      content: {
        'application/json': {
          schema: failedUrlsResponseSchema,
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

// POST /api/v1/sites/{siteId}/urls/retry-failed
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/urls/retry-failed',
  summary: 'Retry all failed URLs',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            maxRetries: z.number().int().optional().openapi({
              description: 'Maximum retry attempts (default: 3)',
              example: 3,
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Retry initiated successfully',
      content: {
        'application/json': {
          schema: retryResponseSchema,
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

// POST /api/v1/sites/{siteId}/urls/{urlId}/retry
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/urls/{urlId}/retry',
  summary: 'Retry a single failed URL',
  tags: ['URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      urlId: z.string().uuid().openapi({ description: 'URL ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Retry initiated successfully',
      content: {
        'application/json': {
          schema: urlMessageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'URL not found',
    },
  },
});

// Type exports
export type UrlQuery = z.infer<typeof urlQuerySchema>;
export type UrlParams = z.infer<typeof urlParamsSchema>;
export type UpdateUrlInput = z.infer<typeof updateUrlSchema>;
export type BulkUpdateUrlsInput = z.infer<typeof bulkUpdateUrlsSchema>;
export type AddUrlsInput = z.infer<typeof addUrlsSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
