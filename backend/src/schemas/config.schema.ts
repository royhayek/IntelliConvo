import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Public Configuration Schemas
 * OpenAPI schemas for public configuration endpoints
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Public config response schema
export const publicConfigResponseSchema = registry.register(
  'PublicConfigResponse',
  z.object({
    platformName: z.string().openapi({
      description: 'Platform name',
      example: 'IntelligentConvo',
    }),
    supportEmail: z.string().email().openapi({
      description: 'Support email address',
      example: 'support@intelligentconvo.com',
    }),
    maintenanceMode: z.boolean().openapi({
      description: 'Whether the platform is in maintenance mode',
      example: false,
    }),
    requireEmailVerification: z.boolean().openapi({
      description: 'Whether email verification is required for new users',
      example: false,
    }),
    enabledAuthProviders: z.array(z.string()).openapi({
      description: 'List of enabled authentication providers',
      example: ['email', 'google', 'github'],
    }),
  }).openapi({
    description: 'Public configuration settings',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/config/public
registry.registerPath({
  method: 'get',
  path: '/api/v1/config/public',
  summary: 'Get public configuration',
  description: 'Returns public configuration settings for the frontend',
  tags: ['Config'],
  responses: {
    200: {
      description: 'Public configuration',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: publicConfigResponseSchema,
          }),
        },
      },
    },
  },
});

// Type exports
export type PublicConfigResponse = z.infer<typeof publicConfigResponseSchema>;
