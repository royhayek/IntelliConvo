/**
 * Centralized DTO Exports
 * Single entry point for all Data Transfer Objects
 */

// Common DTOs
export * from './common.dto';

// Domain-specific DTOs
export * from './auth.dto';
export * from './billing.dto';
export * from './conversation.dto';
export * from './site.dto';
export * from './subscription.dto';

/**
 * DTO Organization:
 *
 * common.dto.ts       - Shared response types (ApiSuccessResponse, PaginatedResponse, etc.)
 * auth.dto.ts         - Authentication & user management types
 * billing.dto.ts      - Billing & transaction types
 * conversation.dto.ts - Conversation & message types
 * site.dto.ts         - Site management types
 * subscription.dto.ts - Subscription & plan types
 */
