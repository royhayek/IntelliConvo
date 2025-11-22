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

// Auth schemas (canonical source for changePasswordSchema)
export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  logoutSchema,
  authTokensSchema,
  authMessageResponseSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  ChangePasswordInput,
  LogoutInput,
} from './auth.schema';

// Account schemas (excluding duplicates - use auth/billing versions)
export {
  updateAccountSchema,
  userInfoSchema,
  accountResponseSchema,
  UpdateAccountInput,
  // Note: changePasswordSchema, updateBillingInfoSchema, billingInfoResponseSchema, messageResponseSchema
  // are exported from their canonical sources (auth.schema, billing.schema, files.schema)
} from './account.schema';

// Site schemas (excluding startersResponseSchema - use widget.schema version)
export {
  createSiteSchema,
  updateSiteSchema,
  updateStartersSchema,
  addHostSchema,
  updateHostSchema,
  siteParamsSchema,
  hostParamsSchema,
  siteResponseSchema,
  hostResponseSchema,
  hostsListResponseSchema,
  sitesListResponseSchema,
  sitesMessageResponseSchema,
  CreateSiteInput,
  UpdateSiteInput,
  UpdateStartersInput,
  AddHostInput,
  UpdateHostInput,
  SiteParams,
  HostParams,
  // Note: startersResponseSchema is exported from widget.schema
} from './sites.schema';

// File schemas (canonical source for messageResponseSchema)
export {
  fileQuerySchema,
  reprocessFileSchema,
  fileParamsSchema,
  knowledgeFileSchema,
  ALLOWED_FILE_MIME_TYPES,
  FILE_UPLOAD_CONSTRAINTS,
  filesListResponseSchema,
  fileUploadResponseSchema,
  messageResponseSchema,
  FileQuery,
  ReprocessFileInput,
  FileParams,
} from './files.schema';

// Billing schemas (canonical source for updateBillingInfoSchema, billingInfoResponseSchema)
export {
  billingHistoryQuerySchema,
  transactionParamsSchema,
  billingInfoSchema,
  updateBillingInfoSchema,
  billingInfoResponseSchema,
  billingTransactionSchema,
  billingSummarySchema,
  billingHistoryResponseSchema,
  BillingHistoryQuery,
  TransactionParams,
  BillingInfoInput,
  UpdateBillingInfoInput,
} from './billing.schema';

// Conversation schemas
export * from './conversations.schema';

// URL schemas
export * from './urls.schema';

// Subscription schemas
export * from './subscriptions.schema';

// Widget schemas (canonical source for startersResponseSchema)
export {
  errorSchema,
  startersResponseSchema,
  siteConfigResponseSchema,
  validateSiteResponseSchema,
  widgetSettingsSchema,
  updateWidgetSettingsSchema,
  ErrorResponse,
  StartersResponse,
  SiteConfigResponse,
  ValidateSiteResponse,
  WidgetSettings,
} from './widget.schema';

// Admin schemas
export * from './admin.schema';

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
 * widget.schema.ts        - Widget settings & starters
 * admin.schema.ts         - Admin management
 */
