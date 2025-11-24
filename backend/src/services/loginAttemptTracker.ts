/**
 * Login Attempt Tracker Service
 * Tracks failed login attempts and enforces lockout policies using Redis
 */

import { cacheService, CacheNamespace } from './cache';
import { settings } from '../lib/settings';
import { logger } from '../utils/logger';

// Cache TTL for login attempts (15 minutes default window)
const LOGIN_ATTEMPT_TTL = 15 * 60; // 15 minutes in seconds

interface LoginAttemptData {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

class LoginAttemptTracker {
  /**
   * Generate cache key for login attempts
   * Uses email to track per-user attempts
   */
  private getKey(email: string): string {
    // Normalize email to lowercase
    return `login:${email.toLowerCase()}`;
  }

  /**
   * Check if the user/IP is currently locked out
   * @param email - User email
   * @returns Object with locked status and retry time
   */
  async isLockedOut(email: string): Promise<{ locked: boolean; retryAfter?: number }> {
    try {
      const key = this.getKey(email);
      const data = await cacheService.get<LoginAttemptData>(CacheNamespace.RATE_LIMIT, key);

      if (!data) {
        return { locked: false };
      }

      // Check if currently locked
      if (data.lockedUntil && data.lockedUntil > Date.now()) {
        const retryAfter = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        return { locked: true, retryAfter };
      }

      return { locked: false };
    } catch (error) {
      logger.error('Error checking lockout status:', error);
      // Fail open - don't lock out on errors
      return { locked: false };
    }
  }

  /**
   * Record a failed login attempt
   * @param email - User email
   * @returns Object with locked status if lockout triggered
   */
  async recordFailedAttempt(email: string): Promise<{ locked: boolean; retryAfter?: number; attempts: number }> {
    try {
      const key = this.getKey(email);
      const maxAttempts = await settings.getMaxLoginAttempts();

      // Get current attempt data
      let data = await cacheService.get<LoginAttemptData>(CacheNamespace.RATE_LIMIT, key);

      if (!data) {
        data = {
          attempts: 0,
          lastAttempt: Date.now(),
        };
      }

      // Increment attempts
      data.attempts += 1;
      data.lastAttempt = Date.now();

      // Check if we should lock out
      if (data.attempts >= maxAttempts) {
        // Lock out for 15 minutes
        data.lockedUntil = Date.now() + LOGIN_ATTEMPT_TTL * 1000;

        logger.warn(`Account locked out due to failed login attempts: ${email}`, {
          attempts: data.attempts,
          lockedUntil: new Date(data.lockedUntil).toISOString(),
        });
      }

      // Store updated data
      await cacheService.set(CacheNamespace.RATE_LIMIT, key, data, LOGIN_ATTEMPT_TTL);

      if (data.lockedUntil && data.lockedUntil > Date.now()) {
        const retryAfter = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        return { locked: true, retryAfter, attempts: data.attempts };
      }

      return { locked: false, attempts: data.attempts };
    } catch (error) {
      logger.error('Error recording failed login attempt:', error);
      // Fail open
      return { locked: false, attempts: 0 };
    }
  }

  /**
   * Reset login attempts on successful login
   * @param email - User email
   */
  async resetAttempts(email: string): Promise<void> {
    try {
      const key = this.getKey(email);
      await cacheService.delete(CacheNamespace.RATE_LIMIT, key);
    } catch (error) {
      logger.error('Error resetting login attempts:', error);
      // Don't fail the login on cache errors
    }
  }

  /**
   * Get current attempt count for a user
   * @param email - User email
   * @returns Current attempt count
   */
  async getAttemptCount(email: string): Promise<number> {
    try {
      const key = this.getKey(email);
      const data = await cacheService.get<LoginAttemptData>(CacheNamespace.RATE_LIMIT, key);
      return data?.attempts || 0;
    } catch (error) {
      logger.error('Error getting attempt count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const loginAttemptTracker = new LoginAttemptTracker();
