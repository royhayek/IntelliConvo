import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { getConfig } from '../config';

/**
 * Cache Service
 * Provides a clean abstraction over Redis for caching
 * Supports TTL, namespacing, and automatic serialization
 */
class CacheService {
  private client: IORedis | null = null;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  /**
   * Lazy initialization of Redis client
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
        logger.error('Redis Cache connection error:', err);
      });

      this.client.on('connect', () => {
        logger.info('✅ Cache Service connected to Redis');
      });
    }

    return this.client;
  }

  /**
   * Generate a namespaced cache key
   */
  private getKey(namespace: string, key: string): string {
    return `cache:${namespace}:${key}`;
  }

  /**
   * Get a value from cache
   * Returns null if not found or on error
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const cacheKey = this.getKey(namespace, key);
      const value = await this.getClient().get(cacheKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', { namespace, key, error });
      return null; // Fail gracefully
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    ttl?: number
  ): Promise<boolean> {
    try {
      const cacheKey = this.getKey(namespace, key);
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || this.DEFAULT_TTL;

      await this.getClient().setex(cacheKey, ttlSeconds, serialized);

      logger.debug('Cache set:', { namespace, key, ttl: ttlSeconds });
      return true;
    } catch (error) {
      logger.error('Cache set error:', { namespace, key, error });
      return false;
    }
  }

  /**
   * Delete a specific key from cache
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(namespace, key);
      await this.getClient().del(cacheKey);

      logger.debug('Cache deleted:', { namespace, key });
      return true;
    } catch (error) {
      logger.error('Cache delete error:', { namespace, key, error });
      return false;
    }
  }

  /**
   * Delete all keys in a namespace
   */
  async deleteNamespace(namespace: string): Promise<boolean> {
    try {
      const pattern = this.getKey(namespace, '*');
      const keys = await this.getClient().keys(pattern);

      if (keys.length > 0) {
        await this.getClient().del(...keys);
        logger.info('Cache namespace cleared:', { namespace, count: keys.length });
      }

      return true;
    } catch (error) {
      logger.error('Cache deleteNamespace error:', { namespace, error });
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async has(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(namespace, key);
      const exists = await this.getClient().exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error('Cache has error:', { namespace, key, error });
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   * If key exists, return cached value
   * If not, call fetchFn, cache the result, and return it
   */
  async getOrSet<T>(
    namespace: string,
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(namespace, key);
      if (cached !== null) {
        logger.debug('Cache hit:', { namespace, key });
        return cached;
      }

      // Cache miss - fetch data
      logger.debug('Cache miss:', { namespace, key });
      const data = await fetchFn();

      // Store in cache for next time
      await this.set(namespace, key, data, ttl);

      return data;
    } catch (error) {
      logger.error('Cache getOrSet error:', { namespace, key, error });
      // On error, try to fetch directly without caching
      try {
        return await fetchFn();
      } catch (fetchError) {
        logger.error('Fetch function error:', { namespace, key, error: fetchError });
        return null;
      }
    }
  }

  /**
   * Get multiple keys at once
   */
  async getMany<T>(namespace: string, keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    try {
      const cacheKeys = keys.map((k) => this.getKey(namespace, k));
      const values = await this.getClient().mget(...cacheKeys);

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            result.set(key, JSON.parse(value) as T);
          } catch {
            // Skip invalid JSON
          }
        }
      });
    } catch (error) {
      logger.error('Cache getMany error:', { namespace, error });
    }

    return result;
  }

  /**
   * Set multiple keys at once
   */
  async setMany<T>(
    namespace: string,
    entries: Map<string, T>,
    ttl?: number
  ): Promise<boolean> {
    try {
      const ttlSeconds = ttl || this.DEFAULT_TTL;
      const pipeline = this.getClient().pipeline();

      entries.forEach((value, key) => {
        const cacheKey = this.getKey(namespace, key);
        const serialized = JSON.stringify(value);
        pipeline.setex(cacheKey, ttlSeconds, serialized);
      });

      await pipeline.exec();

      logger.debug('Cache setMany:', { namespace, count: entries.size, ttl: ttlSeconds });
      return true;
    } catch (error) {
      logger.error('Cache setMany error:', { namespace, error });
      return false;
    }
  }

  /**
   * Get cache statistics for a namespace
   */
  async getStats(namespace: string): Promise<{ keyCount: number; memoryUsage?: number }> {
    try {
      const pattern = this.getKey(namespace, '*');
      const keys = await this.getClient().keys(pattern);

      return {
        keyCount: keys.length,
      };
    } catch (error) {
      logger.error('Cache getStats error:', { namespace, error });
      return { keyCount: 0 };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Cache Service disconnected');
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      const pattern = 'cache:*';
      const keys = await this.getClient().keys(pattern);

      if (keys.length > 0) {
        await this.getClient().del(...keys);
        logger.warn('All cache cleared', { count: keys.length });
      }

      return true;
    } catch (error) {
      logger.error('Cache flushAll error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export class for testing
export { CacheService };

/**
 * Cache namespace constants
 * Organize cache keys by domain
 */
export const CacheNamespace = {
  WIDGET_SETTINGS: 'widget',
  SITE_CONFIG: 'site',
  CONVERSATION_STARTERS: 'starters',
  SITE_STATS: 'stats',
  USER_SESSION: 'session',
  EMBEDDING_SEARCH: 'embedding',
} as const;

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;
