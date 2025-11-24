import { prisma } from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../middleware/errors';
import { SettingCategory, SettingType } from '@prisma/client';
import { invalidateSetting, clearSettingsCache } from '../../lib/settings';
import { clearRateLimitCache } from '../../middleware/rateLimiter';
import { clearMaintenanceModeCache } from '../../middleware/maintenance';
import { cacheService, CacheNamespace } from '../cache';

interface SettingUpdate {
  key: string;
  value: string;
}

interface SettingWithParsedValue {
  id: string;
  key: string;
  value: string;
  parsedValue: unknown;
  type: SettingType;
  category: SettingCategory;
  label: string;
  description: string | null;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

class AdminSettingsService {
  /**
   * Get all settings, optionally filtered by category
   */
  async getSettings(category?: SettingCategory) {
    const where = category ? { category } : {};

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Mask secret values
    return {
      settings: settings.map(setting => ({
        ...setting,
        value: setting.isSecret ? '********' : setting.value,
      })),
    };
  }

  /**
   * Get all settings grouped by category
   */
  async getSettingsByCategory() {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category and mask secrets
    const grouped = settings.reduce((acc, setting) => {
      const category = setting.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        ...setting,
        value: setting.isSecret ? '********' : setting.value,
      });
      return acc;
    }, {} as Record<SettingCategory, typeof settings>);

    return grouped;
  }

  /**
   * Get a specific setting by key
   */
  async getSettingByKey(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundError('Setting', key);
    }

    return {
      ...setting,
      value: setting.isSecret ? '********' : setting.value,
    };
  }

  /**
   * Get a setting value (for internal use - returns actual value including secrets)
   */
  async getValue<T = string>(key: string, defaultValue?: T): Promise<T> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new NotFoundError('Setting', key);
    }

    return this.parseValue(setting.value, setting.type) as T;
  }

  /**
   * Update a single setting
   */
  async updateSetting(key: string, value: string, updatedBy: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundError('Setting', key);
    }

    // Validate value based on type
    this.validateValue(value, setting.type);

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        updatedBy,
      },
    });

    // Invalidate caches
    invalidateSetting(key);
    // Clear rate limit cache in case rate limit settings changed
    if (key.startsWith('rateLimit.')) {
      clearRateLimitCache();
    }
    // Clear maintenance mode cache if maintenance mode setting changed
    if (key === 'general.maintenanceMode') {
      clearMaintenanceModeCache();
    }
    // Clear subscription plans cache if billing settings changed
    if (key.startsWith('billing.')) {
      await cacheService.deleteNamespace(CacheNamespace.SUBSCRIPTION_PLANS);
    }

    return {
      ...updated,
      value: updated.isSecret ? '********' : updated.value,
    };
  }

  /**
   * Bulk update multiple settings
   */
  async bulkUpdateSettings(settings: SettingUpdate[], updatedBy: string) {
    // Validate all settings exist and values are valid
    const existingSettings = await prisma.systemSetting.findMany({
      where: {
        key: { in: settings.map(s => s.key) },
      },
    });

    const existingKeys = new Set(existingSettings.map(s => s.key));
    const missingKeys = settings.filter(s => !existingKeys.has(s.key)).map(s => s.key);

    if (missingKeys.length > 0) {
      throw new ValidationError(`Settings not found: ${missingKeys.join(', ')}`);
    }

    // Validate all values
    for (const setting of settings) {
      const existingSetting = existingSettings.find(s => s.key === setting.key);
      if (existingSetting) {
        this.validateValue(setting.value, existingSetting.type);
      }
    }

    // Update all settings in a transaction
    const updatedSettings = await prisma.$transaction(
      settings.map(setting =>
        prisma.systemSetting.update({
          where: { key: setting.key },
          data: {
            value: setting.value,
            updatedBy,
          },
        })
      )
    );

    // Clear entire cache since multiple settings changed
    clearSettingsCache();
    // Also clear rate limit cache in case rate limit settings were updated
    clearRateLimitCache();
    // Also clear maintenance mode cache in case it was updated
    clearMaintenanceModeCache();
    // Clear subscription plans cache if any billing settings were updated
    if (settings.some(s => s.key.startsWith('billing.'))) {
      await cacheService.deleteNamespace(CacheNamespace.SUBSCRIPTION_PLANS);
    }

    return {
      settings: updatedSettings.map(setting => ({
        ...setting,
        value: setting.isSecret ? '********' : setting.value,
      })),
    };
  }

  /**
   * Parse a string value to its proper type
   */
  private parseValue(value: string, type: SettingType): unknown {
    switch (type) {
      case 'NUMBER':
        return parseFloat(value);
      case 'BOOLEAN':
        return value.toLowerCase() === 'true';
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Validate a value based on its type
   */
  private validateValue(value: string, type: SettingType): void {
    switch (type) {
      case 'NUMBER':
        if (isNaN(parseFloat(value))) {
          throw new ValidationError(`Invalid number value: ${value}`);
        }
        break;
      case 'BOOLEAN':
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new ValidationError(`Invalid boolean value: ${value}. Must be 'true' or 'false'`);
        }
        break;
      case 'JSON':
        try {
          JSON.parse(value);
        } catch {
          throw new ValidationError(`Invalid JSON value: ${value}`);
        }
        break;
      // STRING type accepts any value
    }
  }

  /**
   * Clear all caches except user sessions
   * Safe to run anytime - caches will repopulate on next request
   */
  async clearAllCaches(): Promise<{ cleared: string[] }> {
    const cleared: string[] = [];

    // Clear in-memory caches
    clearSettingsCache();
    cleared.push('settings');

    clearRateLimitCache();
    cleared.push('rateLimit');

    clearMaintenanceModeCache();
    cleared.push('maintenanceMode');

    // Clear Redis caches (except sessions)
    await cacheService.deleteNamespace(CacheNamespace.SUBSCRIPTION_PLANS);
    cleared.push('subscriptionPlans');

    await cacheService.deleteNamespace(CacheNamespace.EMBEDDING_SEARCH);
    cleared.push('embeddingSearch');

    await cacheService.deleteNamespace(CacheNamespace.DISCOVERY);
    cleared.push('discovery');

    await cacheService.deleteNamespace(CacheNamespace.WIDGET_SETTINGS);
    cleared.push('widgetSettings');

    await cacheService.deleteNamespace(CacheNamespace.SITE_CONFIG);
    cleared.push('siteConfig');

    await cacheService.deleteNamespace(CacheNamespace.CONVERSATION_STARTERS);
    cleared.push('conversationStarters');

    await cacheService.deleteNamespace(CacheNamespace.SITE_STATS);
    cleared.push('siteStats');

    // Note: We intentionally do NOT clear USER_SESSION as that would log everyone out

    return { cleared };
  }
}

export const adminSettingsService = new AdminSettingsService();
