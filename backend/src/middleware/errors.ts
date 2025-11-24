/**
 * Error codes for standardized error handling
 */
export enum ErrorCode {
  // Authentication (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_REQUIRED = 'TOKEN_REQUIRED',

  // Authorization (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',

  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Business Logic (400, 422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE = 'INVALID_STATE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // External Services (502, 503)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  OPENAI_ERROR = 'OPENAI_ERROR',
  PINECONE_ERROR = 'PINECONE_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',

  // Server (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly timestamp: Date;

  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly isOperational: boolean = true,
    public readonly data?: any
  ) {
    super(message);
    this.timestamp = new Date();
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
        ...(this.data && { details: this.data }),
      },
    };
  }
}

/**
 * Authentication Errors (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = ErrorCode.UNAUTHORIZED) {
    super(401, code, message);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Authentication token has expired') {
    super(401, ErrorCode.TOKEN_EXPIRED, message);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid authentication token') {
    super(401, ErrorCode.INVALID_TOKEN, message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password') {
    super(401, ErrorCode.INVALID_CREDENTIALS, message);
  }
}

export class AccountLockedError extends AppError {
  constructor(retryAfter: number, message?: string) {
    super(
      429,
      ErrorCode.ACCOUNT_LOCKED,
      message || `Account temporarily locked due to too many failed login attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      true,
      { retryAfter }
    );
  }
}

/**
 * Authorization Errors (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', code = ErrorCode.FORBIDDEN) {
    super(403, code, message);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message = 'Insufficient permissions to perform this action') {
    super(403, ErrorCode.INSUFFICIENT_PERMISSIONS, message);
  }
}

/**
 * Validation Errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, data?: any) {
    super(400, ErrorCode.VALIDATION_ERROR, message, true, data);
  }
}

export class InvalidInputError extends AppError {
  constructor(field: string, reason?: string) {
    const message = reason
      ? `Invalid value for ${field}: ${reason}`
      : `Invalid value for ${field}`;
    super(400, ErrorCode.INVALID_INPUT, message, true, { field, reason });
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, data?: any) {
    super(400, ErrorCode.INVALID_INPUT, message, true, data);
  }
}

/**
 * Resource Errors (404, 409)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(404, ErrorCode.NOT_FOUND, message, true, { resource, identifier });
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super(409, ErrorCode.ALREADY_EXISTS, message, true, { resource, field });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, data?: any) {
    super(409, ErrorCode.CONFLICT, message, true, data);
  }
}

/**
 * Business Logic Errors (400, 422)
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, data?: any) {
    super(422, ErrorCode.BUSINESS_RULE_VIOLATION, message, true, data);
  }
}

export class InvalidStateError extends AppError {
  constructor(message: string, data?: any) {
    super(400, ErrorCode.INVALID_STATE, message, true, data);
  }
}

/**
 * External Service Errors (502, 503)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, originalError?: any) {
    super(
      502,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message || `External service error: ${service}`,
      true,
      { service, originalError: originalError?.message }
    );
  }
}

export class OpenAIError extends AppError {
  constructor(message?: string, originalError?: any) {
    super(
      502,
      ErrorCode.OPENAI_ERROR,
      message || 'OpenAI API error',
      true,
      { service: 'OpenAI', originalError: originalError?.message }
    );
  }
}

export class PineconeError extends AppError {
  constructor(message?: string, originalError?: any) {
    super(
      502,
      ErrorCode.PINECONE_ERROR,
      message || 'Pinecone API error',
      true,
      { service: 'Pinecone', originalError: originalError?.message }
    );
  }
}

export class StripeError extends AppError {
  constructor(message?: string, originalError?: any) {
    super(
      502,
      ErrorCode.STRIPE_ERROR,
      message || 'Stripe API error',
      true,
      { service: 'Stripe', originalError: originalError?.message }
    );
  }
}

/**
 * Server Errors (500, 503)
 */
export class InternalError extends AppError {
  constructor(message = 'Internal server error', originalError?: any) {
    super(
      500,
      ErrorCode.INTERNAL_ERROR,
      message,
      false,
      originalError ? { originalError: originalError.message } : undefined
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError?: any) {
    super(
      500,
      ErrorCode.DATABASE_ERROR,
      message,
      false,
      originalError ? { originalError: originalError.message } : undefined
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(503, ErrorCode.SERVICE_UNAVAILABLE, message, true);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(500, ErrorCode.CONFIGURATION_ERROR, message, false);
  }
}

/**
 * Rate Limiting Errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later', retryAfter?: number) {
    super(
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      message,
      true,
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * Helper function to check if an error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Helper function to convert unknown errors to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, error);
  }

  return new InternalError('An unknown error occurred');
}
