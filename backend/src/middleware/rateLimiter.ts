import rateLimit from 'express-rate-limit';
import { getConfig } from '../config';
import { RateLimitError } from './errors';

// Cached rate limiter instances (lazy initialization)
let globalLimiterInstance: ReturnType<typeof rateLimit> | null = null;
let authLimiterInstance: ReturnType<typeof rateLimit> | null = null;

/**
 * Global API rate limiter
 * Applies to all /api routes
 * Cached for reuse across requests
 */
export function createGlobalRateLimiter() {
  if (!globalLimiterInstance) {
    const config = getConfig();

    globalLimiterInstance = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req, res) => {
        const error = new RateLimitError(
          'Too many requests from this IP, please try again later.',
          Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
        );
        res.status(error.statusCode).json(error.toJSON());
      },
    });
  }

  return globalLimiterInstance;
}

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 * Cached for reuse across requests
 */
export function createAuthRateLimiter() {
  if (!authLimiterInstance) {
    const config = getConfig();

    authLimiterInstance = rateLimit({
      windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS, // 15 minutes by default
      max: config.AUTH_RATE_LIMIT_MAX_REQUESTS, // 5 requests by default
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful auth attempts
      handler: (req, res) => {
        const retryAfter = Math.ceil(config.AUTH_RATE_LIMIT_WINDOW_MS / 1000);
        const error = new RateLimitError(
          'Too many authentication attempts. Please try again later.',
          retryAfter
        );
        res.setHeader('Retry-After', retryAfter);
        res.status(error.statusCode).json(error.toJSON());
      },
    });
  }

  return authLimiterInstance;
}

/**
 * Custom rate limiter for chat/conversation endpoints
 * Balanced between usability and preventing abuse
 */
export function createChatRateLimiter() {
  const config = getConfig();

  return rateLimit({
    windowMs: 60000, // 1 minute
    max: 20, // 20 messages per minute
    message: 'Too many messages, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
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
