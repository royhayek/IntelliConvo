/**
 * Common Data Transfer Objects (DTOs)
 * Shared response types across all API endpoints
 */

/**
 * Standard success response wrapper
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    correlationId?: string;
    stack?: string; // Only in development
  };
  timestamp: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

/**
 * Generic list response without pagination
 */
export interface ListResponse<T> {
  success: true;
  data: T[];
  total: number;
  timestamp: string;
}

/**
 * Message-only response
 */
export interface MessageResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  environment?: string;
}

/**
 * Detailed health check response
 */
export interface DetailedHealthCheckResponse extends HealthCheckResponse {
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'unhealthy' | 'not_configured';
      responseTime: number;
      error: string | null;
    };
  };
  system: {
    memory: {
      heapUsed: string;
      heapTotal: string;
      rss: string;
      external: string;
    };
    cpu: any;
  };
  checkDuration: string;
}
