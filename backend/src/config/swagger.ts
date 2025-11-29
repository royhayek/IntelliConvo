import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { generateOpenAPIDocument } from './openapi';

/**
 * Swagger UI Configuration
 *
 * This configuration uses Zod schemas via zod-to-openapi for:
 * - Type-safe schema generation
 * - Path registration via registry.registerPath()
 * - Single source of truth for request/response schemas
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
import '../schemas/account.schema';
import '../schemas/admin.schema';
import '../schemas/notifications.schema';
import '../schemas/admin-sessions.schema';
import '../schemas/admin-audit.schema';
import '../schemas/admin-emails.schema';
import '../schemas/webhooks.schema';
import '../schemas/health.schema';
import '../schemas/config.schema';

// Generate complete OpenAPI document from Zod schemas
const openApiDocument = generateOpenAPIDocument();

export const setupSwagger = (app: Express): void => {
  const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'IntelliConvo API Documentation',
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
