import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

/**
 * OpenAPI Registry
 * Central registry for all OpenAPI schemas generated from Zod schemas
 */

// Create the registry instance
export const registry = new OpenAPIRegistry();

/**
 * Generate the complete OpenAPI document
 */
export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'IntelligentConvo API',
      version: '1.0.0',
      description:
        'A comprehensive API for IntelligentConvo - an AI-powered conversation platform that provides intelligent chatbot solutions for websites',
      contact: {
        name: 'API Support',
        email: 'support@intelligentconvo.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: process.env.PRODUCTION_API_URL || 'https://api.intelligentconvo.com',
        description: 'Production server',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization operations',
      },
      {
        name: 'Sites',
        description: 'Website management operations',
      },
      {
        name: 'URLs',
        description: 'URL crawling and content management operations',
      },
      {
        name: 'Files',
        description: 'Knowledge file upload and management operations',
      },
      {
        name: 'Conversations',
        description: 'Chat conversation management operations',
      },
      {
        name: 'Subscriptions',
        description: 'User subscription and billing operations',
      },
      {
        name: 'Widget',
        description: 'Chat widget configuration and public endpoints',
      },
      {
        name: 'Account',
        description: 'User account management operations',
      },
      {
        name: 'Billing',
        description: 'Billing information and transaction operations',
      },
      {
        name: 'Webhooks',
        description: 'External webhook operations',
      },
      {
        name: 'Health',
        description: 'System health check operations',
      },
      {
        name: 'Config',
        description: 'Public configuration endpoints',
      },
      {
        name: 'Admin - Emails',
        description: 'Admin email log management operations',
      },
      {
        name: 'Admin - Audit',
        description: 'Admin audit log operations',
      },
    ],
  });
}

/**
 * Register common security schemes
 */
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter your JWT token',
});

registry.registerComponent('securitySchemes', 'googleOAuth', {
  type: 'oauth2',
  flows: {
    authorizationCode: {
      authorizationUrl: '/api/auth/google',
      tokenUrl: '/api/auth/google/callback',
      scopes: {
        'profile email': 'Access profile and email',
      },
    },
  },
});

registry.registerComponent('securitySchemes', 'githubOAuth', {
  type: 'oauth2',
  flows: {
    authorizationCode: {
      authorizationUrl: '/api/auth/github',
      tokenUrl: '/api/auth/github/callback',
      scopes: {
        'user:email': 'Access user email',
      },
    },
  },
});

/**
 * Register common error responses
 */
registry.registerComponent('responses', 'UnauthorizedError', {
  description: 'Authentication information is missing or invalid',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      example: {
        error: 'Unauthorized',
        statusCode: 401,
        timestamp: '2023-12-07T10:30:00.000Z',
      },
    },
  },
});

registry.registerComponent('responses', 'ForbiddenError', {
  description: 'Access forbidden - insufficient permissions',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      example: {
        error: 'Forbidden',
        statusCode: 403,
        timestamp: '2023-12-07T10:30:00.000Z',
      },
    },
  },
});

registry.registerComponent('responses', 'NotFoundError', {
  description: 'The requested resource was not found',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      example: {
        error: 'Resource not found',
        statusCode: 404,
        timestamp: '2023-12-07T10:30:00.000Z',
      },
    },
  },
});

registry.registerComponent('responses', 'ValidationError', {
  description: 'Validation error - invalid request data',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      example: {
        error: 'Validation failed',
        statusCode: 400,
        timestamp: '2023-12-07T10:30:00.000Z',
      },
    },
  },
});

registry.registerComponent('responses', 'InternalServerError', {
  description: 'Internal server error',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      example: {
        error: 'Internal server error',
        statusCode: 500,
        timestamp: '2023-12-07T10:30:00.000Z',
      },
    },
  },
});
