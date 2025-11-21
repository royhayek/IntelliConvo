import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs incoming requests and their responses with timing information
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Skip logging for health check endpoints
  if (req.path === '/health' || req.path === '/health/detailed') {
    return next();
  }

  // Log incoming request
  logger.info('Incoming request', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  });

  // Capture the original end function
  const originalEnd = res.end;
  let responseBody: any;

  // Override res.json to capture response body (for debugging)
  const originalJson = res.json;
  res.json = function (body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Override end to log response
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Calculate duration
    const duration = Date.now() - startTime;

    // Determine log level based on status code
    const statusCode = res.statusCode;
    let logLevel: 'info' | 'warn' | 'error' = 'info';

    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    // Log response
    logger[logLevel]('Request completed', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      userId: req.user?.id,
      // Only log response body for errors in development
      ...(statusCode >= 400 &&
        process.env.NODE_ENV === 'development' &&
        responseBody && { response: responseBody }),
    });

    // Call original end
    return originalEnd.call(this, chunk, encoding as BufferEncoding, callback);
  };

  next();
}

/**
 * Performance monitoring middleware
 * Logs slow requests that exceed threshold
 */
export function performanceLogger(thresholdMs: number = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > thresholdMs) {
        logger.warn('Slow request detected', {
          correlationId: req.correlationId,
          method: req.method,
          path: req.path,
          duration,
          threshold: thresholdMs,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  };
}
