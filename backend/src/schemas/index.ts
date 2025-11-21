/**
 * Centralized Schema Exports
 * Single entry point for all Zod validation schemas
 *
 * Usage:
 * import { loginSchema, createSiteSchema } from '@/schemas';
 *
 * Or import specific modules:
 * import * as AuthSchemas from '@/schemas/auth.schema';
 */

// Auth schemas
export * from './auth.schema';

// Site schemas
export * from './sites.schema';

// File schemas
export * from './files.schema';

// Billing schemas
export * from './billing.schema';

// Conversation schemas
export * from './conversations.schema';

// URL schemas
export * from './urls.schema';

// Subscription schemas
export * from './subscriptions.schema';

// Widget schemas
export * from './widget.schema';

/**
 * Schema Organization:
 *
 * auth.schema.ts          - Authentication & user management
 * sites.schema.ts         - Site CRUD operations
 * files.schema.ts         - Knowledge file uploads
 * billing.schema.ts       - Billing & transactions
 * conversations.schema.ts - Conversations & messages
 * urls.schema.ts          - Site URL management
 * subscriptions.schema.ts - Subscription management
 */
