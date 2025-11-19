import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof z.ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    const errors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));
    return res.status(statusCode).json({
      error: message,
      details: errors
    });
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate entry';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Log error
  logger.error({
    error: error.message,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: error.stack
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};