import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Correlation ID middleware
 * Generates or extracts a correlation ID for request tracing
 * The correlation ID is:
 * - Extracted from X-Correlation-ID header if present
 * - Generated as a new UUID if not present
 * - Added to the response headers
 * - Available on req.correlationId for logging
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if correlation ID already exists in header
  const existingId = req.headers['x-correlation-id'] as string;

  // Use existing ID or generate new one
  const correlationId = existingId || uuidv4();

  // Attach to request object
  req.correlationId = correlationId;

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}
