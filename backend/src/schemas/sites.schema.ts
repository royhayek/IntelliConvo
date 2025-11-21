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
    crawlStatus: z.enum(['PENDING', 'CRAWLING', 'COMPLETED', 'FAILED']).openapi({ description: 'Crawl status' }),
    lastCrawledAt: z.string().nullable().openapi({ description: 'Last crawl timestamp' }),
    createdAt: z.string().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().openapi({ description: 'Update timestamp' }),
  }).openapi({
    description: 'Site information',
  })
);

// Type exports
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type UpdateStartersInput = z.infer<typeof updateStartersSchema>;
export type AddHostInput = z.infer<typeof addHostSchema>;
export type UpdateHostInput = z.infer<typeof updateHostSchema>;
export type SiteParams = z.infer<typeof siteParamsSchema>;
export type HostParams = z.infer<typeof hostParamsSchema>;
