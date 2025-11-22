import rateLimit from 'express-rate-limit';
import { RateLimitError } from './errors';

// Read rate limit config directly from env with defaults
// This avoids dependency on config initialization order
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const AUTH_RATE_LIMIT_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10);
const AUTH_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10);

/**
 * Global API rate limiter
 * Applies to all /api routes
 */
export function createGlobalRateLimiter() {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error = new RateLimitError(
        'Too many requests from this IP, please try again later.',
        Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
      );
      res.status(error.statusCode).json(error.toJSON());
    },
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      const retryAfter = Math.ceil(AUTH_RATE_LIMIT_WINDOW_MS / 1000);
      const error = new RateLimitError(
        'Too many authentication attempts. Please try again later.',
        retryAfter
      );
      res.setHeader('Retry-After', retryAfter);
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
