/**
 * Response Helper Utilities
 * Standardized response formatting for all API endpoints
 */

import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  ListResponse,
  MessageResponse,
  PaginationMeta,
} from '../dto/common.dto';
import { AppError } from '../middleware/errors';

/**
 * Create a standardized success response
 * @param data - The data to return
 * @param message - Optional success message
 * @returns Standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized paginated response
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @returns Standardized paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized list response (without pagination)
 * @param data - Array of items
 * @param total - Total count
 * @returns Standardized list response
 */
export function listResponse<T>(data: T[], total?: number): ListResponse<T> {
  return {
    success: true,
    data,
    total: total ?? data.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized message-only response
 * @param message - Success message
 * @returns Standardized message response
 */
export function messageResponse(message: string): MessageResponse {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized error response
 * @param error - AppError instance
 * @param includeStack - Whether to include stack trace (development only)
 * @param correlationId - Optional correlation ID for tracking
 * @returns Standardized error response
 */
export function errorResponse(
  error: AppError,
  includeStack: boolean = false,
  correlationId?: string
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.data && { details: error.data }),
      ...(correlationId && { correlationId }),
      ...(includeStack && error.stack && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  return response;
}

/**
 * Calculate pagination metadata
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const pageNumber = Math.max(1, page);
  const limitNumber = Math.max(1, limit);
  const totalPages = Math.ceil(total / limitNumber);

  return {
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages,
  };
}

/**
 * Calculate offset for database queries
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Offset value for skip/offset queries
 */
export function calculateOffset(page: number, limit: number): number {
  const pageNumber = Math.max(1, page);
  const limitNumber = Math.max(1, limit);
  return (pageNumber - 1) * limitNumber;
}

/**
 * Normalize pagination parameters
 * @param page - Raw page parameter
 * @param limit - Raw limit parameter
 * @param maxLimit - Maximum allowed limit
 * @returns Normalized pagination parameters
 */
export function normalizePagination(
  page: number = 1,
  limit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number } {
  return {
    page: Math.max(1, page),
    limit: Math.min(maxLimit, Math.max(1, limit)),
  };
}
