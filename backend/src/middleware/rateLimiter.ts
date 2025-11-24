import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { RateLimitError } from './errors';
import { settings } from '../lib/settings';

// Cache for rate limit settings to avoid DB calls on every request
let rateLimitCache: {
  windowMs: number;
  maxRequests: number;
  authWindowMs: number;
  authMaxRequests: number;
  lastFetch: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Get rate limit settings from cache or database
 */
async function getRateLimitSettings() {
  const now = Date.now();

  // Return cached values if still valid
  if (rateLimitCache && now - rateLimitCache.lastFetch < CACHE_TTL_MS) {
    return rateLimitCache;
  }

  // Fetch from database (with fallback to defaults)
  try {
    const [windowMs, maxRequests, authWindowMs, authMaxRequests] = await Promise.all([
      settings.getRateLimitWindowMs(),
      settings.getRateLimitMaxRequests(),
      settings.getAuthRateLimitWindowMs(),
      settings.getAuthRateLimitMaxRequests(),
    ]);

    rateLimitCache = {
      windowMs,
      maxRequests,
      authWindowMs,
      authMaxRequests,
      lastFetch: now,
    };

    return rateLimitCache;
  } catch (error) {
    // Fallback to defaults if DB is unavailable
    return {
      windowMs: 60000,
      maxRequests: 100,
      authWindowMs: 900000,
      authMaxRequests: 5,
      lastFetch: now,
    };
  }
}

/**
 * Clear the rate limit settings cache
 * Called when settings are updated via admin panel
 */
export function clearRateLimitCache(): void {
  rateLimitCache = null;
}

/**
 * Global API rate limiter
 * Applies to all /api routes
 * Uses database settings with caching for performance
 * Note: windowMs must be fixed at startup, but max can be dynamic
 */
export function createGlobalRateLimiter() {
  // Default window - this is fixed at startup but max is checked dynamically
  const defaultWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

  return rateLimit({
    windowMs: defaultWindowMs,
    // Dynamic max based on database settings
    max: async () => {
      const settings = await getRateLimitSettings();
      return settings.maxRequests;
    },
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res) => {
      const error = new RateLimitError(
        'Too many requests from this IP, please try again later.',
        Math.ceil(defaultWindowMs / 1000)
      );
      res.status(error.statusCode).json(error.toJSON());
    },
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 * Uses database settings with caching for performance
 * Note: windowMs must be fixed at startup, but max can be dynamic
 */
export function createAuthRateLimiter() {
  // Default window - this is fixed at startup but max is checked dynamically
  const defaultAuthWindowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10);

  return rateLimit({
    windowMs: defaultAuthWindowMs,
    max: async () => {
      const settings = await getRateLimitSettings();
      return settings.authMaxRequests;
    },
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: async (req, res) => {
      const retryAfter = Math.ceil(defaultAuthWindowMs / 1000);
      const error = new RateLimitError(
        'Too many authentication attempts. Please try again later.',
        retryAfter
      );
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(error.statusCode).json(error.toJSON());
    },
  });
}

/**
 * Custom rate limiter for chat/conversation endpoints
 * Balanced between usability and preventing abuse
 */
export function createChatRateLimiter() {
  return rateLimit({
    windowMs: 60000, // 1 minute - fixed for chat
    max: 20, // 20 messages per minute - fixed for chat
    message: 'Too many messages, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use session ID or IP as key
      const sessionId = req.body?.sessionId;
      return sessionId || req.ip || 'unknown';
    },
    handler: (req, res) => {
      const error = new RateLimitError(
        'You are sending messages too quickly. Please wait a moment.',
        60
      );
      res.status(error.statusCode).json(error.toJSON());
    },
  });
}
