import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { getConfig } from '../config';

/**
 * Token Blacklist Service
 * Manages revoked JWT tokens using Redis for fast lookup
 * Tokens are stored with TTL matching their expiration time
 */
class TokenBlacklistService {
  private client: IORedis | null = null;
  private readonly KEY_PREFIX = 'blacklist:token:';

  /**
   * Lazy initialization of Redis client
   * Called automatically when first used
   */
  private getClient(): IORedis {
    if (!this.client) {
      const config = getConfig();

      this.client = new IORedis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('error', (err) => {
        logger.error('Redis Token Blacklist connection error:', err);
      });

      this.client.on('connect', () => {
        logger.info('✅ Token Blacklist Service connected to Redis');
      });
    }

    return this.client;
  }

  /**
   * Add a token to the blacklist
   * @param token - The JWT token to blacklist
   * @param expiresIn - Time in seconds until token naturally expires
   * @param reason - Reason for blacklisting (optional, for logging)
   */
  async blacklistToken(token: string, expiresIn: number, reason?: string): Promise<void> {
    try {
      const key = this.getKey(token);
      const value = JSON.stringify({
        blacklistedAt: new Date().toISOString(),
        reason: reason || 'logout',
      });

      // Store with TTL matching token expiration
      // No need to keep it longer as the token won't be valid anyway
      await this.getClient().setex(key, expiresIn, value);

      logger.info('Token blacklisted', {
        tokenPrefix: token.substring(0, 20) + '...',
        expiresIn,
        reason,
      });
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
      // Don't throw - blacklisting failure shouldn't break logout
      // The token will expire naturally
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.getKey(token);
      const exists = await this.getClient().exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      // On error, assume not blacklisted to avoid blocking valid users
      // The token will still need to pass JWT verification
      return false;
    }
  }

  /**
   * Remove a token from the blacklist
   * Generally not needed, but useful for admin operations
   * @param token - The JWT token to remove from blacklist
   */
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = this.getKey(token);
      await this.getClient().del(key);
      logger.info('Token removed from blacklist', {
        tokenPrefix: token.substring(0, 20) + '...',
      });
    } catch (error) {
      logger.error('Failed to remove token from blacklist:', error);
    }
  }

  /**
   * Get blacklist statistics
   * Useful for monitoring
   */
  async getStats(): Promise<{ totalBlacklisted: number }> {
    try {
      const keys = await this.getClient().keys(`${this.KEY_PREFIX}*`);
      return { totalBlacklisted: keys.length };
    } catch (error) {
      logger.error('Failed to get blacklist stats:', error);
      return { totalBlacklisted: 0 };
    }
  }

  /**
   * Clear all blacklisted tokens
   * USE WITH CAUTION - only for testing or emergency situations
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await this.getClient().keys(`${this.KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.getClient().del(...keys);
        logger.warn('All blacklisted tokens cleared', { count: keys.length });
      }
    } catch (error) {
      logger.error('Failed to clear blacklist:', error);
    }
  }

  /**
   * Generate Redis key for a token
   */
  private getKey(token: string): string {
    // Use a hash of the token to save space and add security
    // In production, you might want to use a proper hash function
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `${this.KEY_PREFIX}${hash}`;
  }

  /**
   * Calculate TTL for a token based on JWT expiration
   * @param exp - JWT exp claim (Unix timestamp in seconds)
   * @returns TTL in seconds
   */
  static calculateTTL(exp?: number): number {
    if (!exp) {
      // Default to 7 days if no expiration
      return 7 * 24 * 60 * 60;
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;

    // Ensure TTL is positive and reasonable
    return Math.max(ttl, 60); // Minimum 1 minute
  }

  /**
   * Close Redis connection
   * Should be called on application shutdown
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Token Blacklist Service disconnected');
    }
  }
}

// Export singleton instance
export const tokenBlacklist = new TokenBlacklistService();

// Export class for testing
export { TokenBlacklistService };
