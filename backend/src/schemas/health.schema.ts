import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Health Check Schemas
 * OpenAPI documentation for health check endpoints
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Response Schemas
// ============================================

export const basicHealthSchema = registry.register(
  'BasicHealthResponse',
  z.object({
    status: z.string().openapi({
      description: 'Health status',
      example: 'healthy',
    }),
    timestamp: z.string().openapi({
      description: 'Current server timestamp',
      example: '2024-01-15T10:30:00.000Z',
    }),
  }).openapi({
    description: 'Basic health check response',
  })
);

const serviceStatusSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']).openapi({
    description: 'Service health status',
  }),
  latency: z.string().optional().openapi({
    description: 'Response latency',
    example: '5ms',
  }),
  error: z.string().optional().openapi({
    description: 'Error message if unhealthy',
  }),
}).openapi({
  description: 'Individual service status',
});

export const detailedHealthSchema = registry.register(
  'DetailedHealthResponse',
  z.object({
    status: z.string().openapi({
      description: 'Overall health status',
      example: 'healthy',
    }),
    timestamp: z.string().openapi({
      description: 'Current server timestamp',
    }),
    uptime: z.number().openapi({
      description: 'Server uptime in seconds',
      example: 3600,
    }),
    services: z.object({
      database: serviceStatusSchema,
      redis: serviceStatusSchema,
    }).openapi({
      description: 'Status of individual services',
    }),
  }).openapi({
    description: 'Detailed health check response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /health
registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Basic health check',
  description: 'Returns basic health status of the server',
  tags: ['Health'],
  responses: {
    200: {
      description: 'Server is healthy',
      content: {
        'application/json': {
          schema: basicHealthSchema,
        },
      },
    },
  },
});

// GET /health/detailed
registry.registerPath({
  method: 'get',
  path: '/health/detailed',
  summary: 'Detailed health check',
  description: 'Returns detailed health status including database and Redis connectivity',
  tags: ['Health'],
  responses: {
    200: {
      description: 'All services are healthy',
      content: {
        'application/json': {
          schema: detailedHealthSchema,
        },
      },
    },
    503: {
      description: 'One or more services are unhealthy',
      content: {
        'application/json': {
          schema: detailedHealthSchema,
        },
      },
    },
  },
});
