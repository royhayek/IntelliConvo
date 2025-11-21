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
    lastCrawledAt: z.string().nullable().openapi({ description: 'Last crawl timestamp' }),
    contentHash: z.string().nullable().openapi({ description: 'Content hash for change detection' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
  }).openapi({
    description: 'Site URL information',
  })
);

// Type exports
export type UrlQuery = z.infer<typeof urlQuerySchema>;
export type UrlParams = z.infer<typeof urlParamsSchema>;
export type UpdateUrlInput = z.infer<typeof updateUrlSchema>;
export type BulkUpdateUrlsInput = z.infer<typeof bulkUpdateUrlsSchema>;
export type AddUrlsInput = z.infer<typeof addUrlsSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
