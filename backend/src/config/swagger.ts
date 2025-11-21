import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { generateOpenAPIDocument } from './openapi';

/**
 * Hybrid Swagger UI Configuration
 *
 * This configuration uses a hybrid approach combining the best of both worlds:
 * 1. **Schemas**: Generated from Zod via zod-to-openapi (type-safe, no duplication)
 * 2. **Paths**: Documented with JSDoc comments in route files (close to implementation)
 *
 * Benefits:
 * - Single source of truth for request/response schemas (Zod)
 * - Type safety between code and documentation
 * - Path documentation stays close to route definitions
 * - No massive path registration files
 * - Easy to maintain and understand
 */

// Import all schema files to ensure they register with the OpenAPI registry
import '../schemas/auth.schema';
import '../schemas/sites.schema';
import '../schemas/billing.schema';
import '../schemas/conversations.schema';
import '../schemas/subscriptions.schema';
import '../schemas/files.schema';
import '../schemas/urls.schema';
import '../schemas/widget.schema';

// Generate schemas from Zod
const zodOpenApiDoc = generateOpenAPIDocument();

// Swagger JSDoc configuration to scan route files for path documentation
const swaggerJsdocOptions: swaggerJsdoc.Options = {
  definition: {
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        googleOAuth: {
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
        },
        githubOAuth: {
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
        },
      },
      // Inject Zod-generated schemas
      schemas: zodOpenApiDoc.components?.schemas || {},
      // Inject common responses
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Unauthorized' },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Forbidden' },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Resource not found' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error - invalid request data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Validation failed' },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Internal server error' },
                },
              },
            },
          },
        },
      },
    },
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
        name: 'Monitoring',
        description: 'System monitoring and performance metrics',
      },
    ],
  },
  // Scan route files for @swagger JSDoc comments
  apis: ['./src/routes/*.ts', './src/routes/*.js', './src/index.ts'],
};

// Generate the complete OpenAPI document
const openApiDocument = swaggerJsdoc(swaggerJsdocOptions);

export const setupSwagger = (app: Express): void => {
  const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'IntelligentConvo API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  };

  // Use single route with both middleware in array
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, swaggerOptions));

  // Serve the JSON spec at /api/docs.json
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiDocument);
  });

  // Serve the YAML spec at /api/docs.yaml (optional)
  app.get('/api/docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    // Simple JSON to YAML conversion
    const yaml = JSON.stringify(openApiDocument, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '');
    res.send(yaml);
  });
};

// Export the generated document for use in other parts of the application
export { openApiDocument as specs };
