import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Webhooks Schemas
 * OpenAPI documentation for webhook endpoints
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Response Schemas
// ============================================

export const webhookReceivedSchema = registry.register(
  'WebhookReceived',
  z.object({
    received: z.boolean().openapi({
      description: 'Indicates webhook was received successfully',
      example: true,
    }),
  }).openapi({
    description: 'Webhook acknowledgment response',
  })
);

// ============================================
// Path Registrations
// ============================================

// POST /api/v1/webhooks/stripe
registry.registerPath({
  method: 'post',
  path: '/api/v1/webhooks/stripe',
  summary: 'Stripe webhook handler',
  description: 'Handle Stripe webhook events for subscription and payment updates',
  tags: ['Webhooks'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({}).passthrough().openapi({
            description: 'Stripe event payload',
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Webhook processed successfully',
      content: {
        'application/json': {
          schema: webhookReceivedSchema,
        },
      },
    },
    400: {
      description: 'Invalid webhook signature or missing secret',
    },
    500: {
      description: 'Webhook processing failed',
    },
  },
});
