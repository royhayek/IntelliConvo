import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance Metrics Middleware
 * Tracks request performance, response times, and identifies slow requests
 */

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SLOW: 1000, // Warn if request takes longer than 1 second
  VERY_SLOW: 3000, // Error if request takes longer than 3 seconds
};

// In-memory metrics storage (can be replaced with Redis or time-series DB)
interface RequestMetrics {
  totalRequests: number;
  slowRequests: number;
  averageResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<number, number>;
  requestsByEndpoint: Record<string, { count: number; totalTime: number; avgTime: number }>;
}

const metrics: RequestMetrics = {
  totalRequests: 0,
  slowRequests: 0,
  averageResponseTime: 0,
  requestsByMethod: {},
  requestsByStatus: {},
  requestsByEndpoint: {},
};

/**
 * Get normalized endpoint path for metrics
 * Replaces UUID and ID path segments with placeholders
 */
function normalizeEndpoint(path: string): string {
  return path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id'
    ) // UUIDs
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[^/]+@[^/]+/g, '/:email'); // Email addresses
}

/**
 * Update metrics with request data
 */
function updateMetrics(
  method: string,
  path: string,
  statusCode: number,
  duration: number
): void {
  // Update total requests
  metrics.totalRequests++;

  // Update average response time (rolling average)
  metrics.averageResponseTime =
    (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) /
    metrics.totalRequests;

  // Track slow requests
  if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
    metrics.slowRequests++;
  }

  // Track requests by method
  metrics.requestsByMethod[method] = (metrics.requestsByMethod[method] || 0) + 1;

  // Track requests by status code
  metrics.requestsByStatus[statusCode] = (metrics.requestsByStatus[statusCode] || 0) + 1;

  // Track requests by endpoint
  const normalizedPath = normalizeEndpoint(path);
  if (!metrics.requestsByEndpoint[normalizedPath]) {
    metrics.requestsByEndpoint[normalizedPath] = {
      count: 0,
      totalTime: 0,
      avgTime: 0,
    };
  }

  const endpointMetric = metrics.requestsByEndpoint[normalizedPath];
  endpointMetric.count++;
  endpointMetric.totalTime += duration;
  endpointMetric.avgTime = endpointMetric.totalTime / endpointMetric.count;
}

/**
 * Performance tracking middleware
 * Measures request duration and logs slow requests
 */
export function performanceTracker(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Calculate duration in milliseconds
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

    // Calculate memory delta
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    // Update metrics
    updateMetrics(req.method, req.path, res.statusCode, duration);

    // Add performance headers before sending response
    // Only set if headers haven't been sent yet
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      } catch (error) {
        // Ignore header setting errors
      }
    }

    // Restore original end function
    res.end = originalEnd;

    // Log based on performance
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };

    if (duration > PERFORMANCE_THRESHOLDS.VERY_SLOW) {
      logger.error('Very slow request detected', logData);
    } else if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.debug('Request completed', logData);
    }

    // Call the original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): RequestMetrics {
  return {
    ...metrics,
    requestsByMethod: { ...metrics.requestsByMethod },
    requestsByStatus: { ...metrics.requestsByStatus },
    requestsByEndpoint: { ...metrics.requestsByEndpoint },
  };
}

/**
 * Reset performance metrics (useful for testing or periodic resets)
 */
export function resetPerformanceMetrics(): void {
  metrics.totalRequests = 0;
  metrics.slowRequests = 0;
  metrics.averageResponseTime = 0;
  metrics.requestsByMethod = {};
  metrics.requestsByStatus = {};
  metrics.requestsByEndpoint = {};
}

/**
 * Get top slowest endpoints
 */
export function getSlowestEndpoints(limit: number = 10): Array<{
  endpoint: string;
  avgTime: number;
  count: number;
}> {
  return Object.entries(metrics.requestsByEndpoint)
    .map(([endpoint, data]) => ({
      endpoint,
      avgTime: data.avgTime,
      count: data.count,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, limit);
}

/**
 * Middleware to expose metrics endpoint
 * Usage: app.get('/metrics', metricsEndpoint)
 */
export function metricsEndpoint(req: Request, res: Response): void {
  const currentMetrics = getPerformanceMetrics();
  const slowestEndpoints = getSlowestEndpoints(10);

  res.json({
    summary: {
      totalRequests: currentMetrics.totalRequests,
      slowRequests: currentMetrics.slowRequests,
      slowRequestPercentage:
        currentMetrics.totalRequests > 0
          ? ((currentMetrics.slowRequests / currentMetrics.totalRequests) * 100).toFixed(2) + '%'
          : '0%',
      averageResponseTime: `${currentMetrics.averageResponseTime.toFixed(2)}ms`,
      uptimeSeconds: process.uptime(),
    },
    memory: {
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
    },
    requests: {
      byMethod: currentMetrics.requestsByMethod,
      byStatus: currentMetrics.requestsByStatus,
    },
    slowestEndpoints,
  });
}
