/**
 * Validation Middleware
 * Zod-based validation for request body, query parameters, and path parameters
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errors';

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        throw new ValidationError('Request body validation failed', errors);
      }

      // Replace req.body with validated and typed data
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        throw new ValidationError('Query parameters validation failed', errors);
      }

      // Replace req.query with validated and typed data
      req.query = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate path parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        throw new ValidationError('Path parameters validation failed', errors);
      }

      // Replace req.params with validated and typed data
      req.params = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate multiple parts of the request
 * @param schemas - Object with body, query, and/or params schemas
 * @returns Express middleware function
 */
export function validate<
  TBody = any,
  TQuery = any,
  TParams = any
>(schemas: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: any[] = [];

      // Validate body
      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.push(...bodyResult.error.errors.map((err) => ({
            location: 'body',
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })));
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validate query
      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.push(...queryResult.error.errors.map((err) => ({
            location: 'query',
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })));
        } else {
          req.query = queryResult.data as any;
        }
      }

      // Validate params
      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.push(...paramsResult.error.errors.map((err) => ({
            location: 'params',
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })));
        } else {
          req.params = paramsResult.data as any;
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Request validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
