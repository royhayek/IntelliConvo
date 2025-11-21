/**
 * Service Layer Exports
 * Centralized export point for all business logic services
 */

// Billing Service
export { BillingService, billingService } from './billing/BillingService';

// Conversation Service
export { ConversationService, conversationService } from './conversation/ConversationService';

// Site Service
export { SiteService, siteService } from './site/SiteService';

// Subscription Service
export { SubscriptionService, subscriptionService } from './subscription/SubscriptionService';

// Auth Service
export { AuthService, authService } from './auth/AuthService';

// URL Service
export { UrlService, urlService } from './url/UrlService';

// File Service
export { FileService, fileService } from './file/FileService';

/**
 * Service Layer Architecture
 *
 * Services contain all business logic and are responsible for:
 * - Data validation and transformation
 * - Business rule enforcement
 * - Database operations (via Prisma)
 * - External API calls
 * - Complex calculations and data processing
 *
 * Services should:
 * - Be stateless (or manage state carefully)
 * - Return DTOs (Data Transfer Objects)
 * - Throw AppError instances for errors
 * - Be testable in isolation
 * - Not depend on Express Request/Response objects
 *
 * Route handlers should:
 * - Authenticate and authorize requests
 * - Validate input using middleware
 * - Call service methods
 * - Format responses using response utilities
 * - Handle errors via asyncHandler
 */
