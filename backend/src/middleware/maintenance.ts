/**
 * Maintenance Mode Middleware
 * Blocks non-admin requests when maintenance mode is enabled
 */

import { Request, Response, NextFunction } from 'express';
import { settings } from '../lib/settings';
import { logger } from '../utils/logger';

// Cache maintenance mode status to avoid DB calls on every request
let maintenanceModeCache: { enabled: boolean; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 second cache

/**
 * Check if maintenance mode is enabled (with caching)
 */
async function isMaintenanceModeEnabled(): Promise<boolean> {
  const now = Date.now();

  // Return cached value if still valid
  if (maintenanceModeCache && maintenanceModeCache.expiresAt > now) {
    return maintenanceModeCache.enabled;
  }

  // Fetch from settings
  const enabled = await settings.isMaintenanceMode();

  // Update cache
  maintenanceModeCache = {
    enabled,
    expiresAt: now + CACHE_TTL_MS,
  };

  return enabled;
}

/**
 * Clear maintenance mode cache
 * Call this when maintenance mode setting is updated
 */
export function clearMaintenanceModeCache(): void {
  maintenanceModeCache = null;
}

/**
 * Maintenance mode middleware
 * Allows admin users and health checks through, blocks all other requests
 */
export async function maintenanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Always allow health check endpoints
    if (req.path === '/health' || req.path === '/health/detailed') {
      return next();
    }

    // Check if maintenance mode is enabled
    const isEnabled = await isMaintenanceModeEnabled();

    if (!isEnabled) {
      return next();
    }

    // Allow admin users through
    const user = (req as any).user;
    if (user?.isAdmin) {
      return next();
    }

    // Block all other requests during maintenance
    logger.info(`Maintenance mode: blocked request to ${req.path} from ${req.ip}`);

    res.status(503).json({
      error: 'Service Unavailable',
      message: 'The system is currently undergoing maintenance. Please try again later.',
      code: 'MAINTENANCE_MODE',
    });
  } catch (error) {
    // If we can't check maintenance mode, allow the request through
    logger.error('Error checking maintenance mode:', error);
    next();
  }
}
