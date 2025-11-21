import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  AppError,
  ValidationError,
  AlreadyExistsError,
  NotFoundError,
  DatabaseError,
  isOperationalError,
  ErrorCode,
} from './errors';
import { getConfig } from '../config';
import { errorResponse } from '../utils/response';

/**
 * Global error handler middleware
 * This should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert known error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof z.ZodError) {
    // Zod validation errors
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    appError = new ValidationError('Request validation failed', errors);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma known errors
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    appError = new ValidationError('Database validation failed');
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    // Prisma initialization errors
    appError = new DatabaseError('Database connection failed', error);
  } else {
    // Unknown errors - treat as internal server error
    appError = new AppError(
      500,
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      false
    );
  }

  // Get configuration for logging
  let isDevelopment = false;
  try {
    const config = getConfig();
    isDevelopment = config.NODE_ENV === 'development';
  } catch {
    // Config not initialized yet, default to false
  }

  // Log error with appropriate level
  const logData = {
    correlationId: req.correlationId,
    error: {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    user: req.user?.id,
    ...(isDevelopment && { stack: error.stack }),
  };

  if (isOperationalError(appError)) {
    logger.warn('Operational error occurred', logData);
  } else {
    logger.error('Non-operational error occurred', logData);
  }

  // Prepare standardized error response
  const response = errorResponse(
    appError,
    isDevelopment, // Include stack trace in development
    req.correlationId // Include correlation ID for tracking
  );

  // Send response
  res.status(appError.statusCode).json(response);
};

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[]) || [];
      const field = target.length > 0 ? target[0] : 'field';
      return new AlreadyExistsError('Record', field);

    case 'P2025':
      // Record not found
      return new NotFoundError('Record');

    case 'P2003':
      // Foreign key constraint failed
      return new ValidationError('Referenced record does not exist');

    case 'P2014':
      // Invalid relation
      return new ValidationError('Invalid relation in request');

    case 'P2021':
      // Table does not exist
      return new DatabaseError('Database table not found', error);

    case 'P2024':
      // Timeout
      return new DatabaseError('Database operation timed out', error);

    default:
      return new DatabaseError(`Database error: ${error.code}`, error);
  }
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 * Should be added before the error handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError('Route', req.path);
  next(error);
}

// Re-export AppError for backward compatibility
export { AppError };