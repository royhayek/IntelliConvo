/**
 * System Settings Utility
 * Provides cached access to system settings stored in the database
 * Falls back to environment variables if settings are not found
 */

import { prisma } from './prisma';
import { SettingType } from '@prisma/client';

// In-memory cache for settings
let settingsCache: Map<string, { value: unknown; expiresAt: number }> = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

// Setting keys - use these constants throughout the codebase
export const SettingKeys = {
  // General
  PLATFORM_NAME: 'general.platformName',
  SUPPORT_EMAIL: 'general.supportEmail',
  MAINTENANCE_MODE: 'general.maintenanceMode',

  // AI Models
  AI_DEFAULT_MODEL: 'ai.defaultModel',
  AI_EMBEDDING_MODEL: 'ai.embeddingModel',
  AI_TEMPERATURE: 'ai.temperature',

  // AI Optimization
  AI_MAX_TOKENS: 'ai.maxTokens',
  AI_MAX_RESPONSE_TOKENS: 'ai.maxResponseTokens',
  AI_MAX_HISTORY_TOKENS: 'ai.maxHistoryTokens',
  AI_MAX_CONTENT_CHUNK_TOKENS: 'ai.maxContentChunkTokens',
  AI_MAX_TOTAL_INPUT_TOKENS: 'ai.maxTotalInputTokens',
  AI_VECTOR_SEARCH_TOP_K: 'ai.vectorSearchTopK',
  AI_EMBEDDING_CHUNK_SIZE: 'ai.embeddingChunkSize',
  AI_SYSTEM_PROMPT_DESCRIPTION_LIMIT: 'ai.systemPromptDescriptionLimit',
  AI_SYSTEM_PROMPT_INSTRUCTIONS_LIMIT: 'ai.systemPromptInstructionsLimit',

  // Security
  SESSION_TIMEOUT_DAYS: 'security.sessionTimeoutDays',
  REFRESH_TOKEN_DAYS: 'security.refreshTokenDays',
  MAX_LOGIN_ATTEMPTS: 'security.maxLoginAttempts',

  // Authentication Providers
  AUTH_EMAIL_ENABLED: 'auth.emailEnabled',
  AUTH_GOOGLE_ENABLED: 'auth.googleEnabled',
  AUTH_GITHUB_ENABLED: 'auth.githubEnabled',
  AUTH_MICROSOFT_ENABLED: 'auth.microsoftEnabled',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 'rateLimit.windowMs',
  RATE_LIMIT_MAX_REQUESTS: 'rateLimit.maxRequests',
  AUTH_RATE_LIMIT_WINDOW_MS: 'rateLimit.authWindowMs',
  AUTH_RATE_LIMIT_MAX_REQUESTS: 'rateLimit.authMaxRequests',

  // Email
  EMAIL_FROM_ADDRESS: 'email.fromAddress',
  EMAIL_FROM_NAME: 'email.fromName',
  EMAIL_PROVIDER: 'email.provider',
  EMAIL_VERIFICATION_ENABLED: 'email.verificationEnabled',

  // Billing
  BILLING_TRIAL_DAYS: 'billing.trialDays',
  BILLING_MAX_URLS_PER_SITE: 'billing.maxUrlsPerSite',
  BILLING_CURRENCY: 'billing.currency',

  // Storage
  STORAGE_MAX_FILE_SIZE_MB: 'storage.maxFileSizeMb',
  STORAGE_UPLOAD_DIR: 'storage.uploadDir',
} as const;

// Environment variable fallbacks for each setting
const ENV_FALLBACKS: Record<string, string | undefined> = {
  [SettingKeys.PLATFORM_NAME]: process.env.PLATFORM_NAME,
  [SettingKeys.SUPPORT_EMAIL]: process.env.SUPPORT_EMAIL,
  [SettingKeys.MAINTENANCE_MODE]: process.env.MAINTENANCE_MODE,
  [SettingKeys.AI_DEFAULT_MODEL]: process.env.OPENAI_MODEL,
  [SettingKeys.AI_EMBEDDING_MODEL]: process.env.OPENAI_EMBEDDING_MODEL,
  [SettingKeys.AI_MAX_TOKENS]: process.env.OPENAI_MAX_TOKENS,
  [SettingKeys.AI_TEMPERATURE]: process.env.OPENAI_TEMPERATURE,
  [SettingKeys.SESSION_TIMEOUT_DAYS]: process.env.JWT_EXPIRES_IN?.replace('d', ''),
  [SettingKeys.REFRESH_TOKEN_DAYS]: process.env.JWT_REFRESH_EXPIRES_IN?.replace('d', ''),
  [SettingKeys.MAX_LOGIN_ATTEMPTS]: process.env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  [SettingKeys.AUTH_EMAIL_ENABLED]: process.env.AUTH_EMAIL_ENABLED,
  [SettingKeys.AUTH_GOOGLE_ENABLED]: process.env.AUTH_GOOGLE_ENABLED,
  [SettingKeys.AUTH_GITHUB_ENABLED]: process.env.AUTH_GITHUB_ENABLED,
  [SettingKeys.AUTH_MICROSOFT_ENABLED]: process.env.AUTH_MICROSOFT_ENABLED,
  [SettingKeys.RATE_LIMIT_WINDOW_MS]: process.env.RATE_LIMIT_WINDOW_MS,
  [SettingKeys.RATE_LIMIT_MAX_REQUESTS]: process.env.RATE_LIMIT_MAX_REQUESTS,
  [SettingKeys.AUTH_RATE_LIMIT_WINDOW_MS]: process.env.AUTH_RATE_LIMIT_WINDOW_MS,
  [SettingKeys.AUTH_RATE_LIMIT_MAX_REQUESTS]: process.env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  [SettingKeys.EMAIL_FROM_ADDRESS]: process.env.EMAIL_FROM_ADDRESS || process.env.FROM_EMAIL,
  [SettingKeys.EMAIL_FROM_NAME]: process.env.EMAIL_FROM_NAME || process.env.FROM_NAME,
  [SettingKeys.EMAIL_PROVIDER]: process.env.EMAIL_PROVIDER,
  [SettingKeys.EMAIL_VERIFICATION_ENABLED]: process.env.EMAIL_VERIFICATION_ENABLED,
  [SettingKeys.BILLING_TRIAL_DAYS]: process.env.TRIAL_DAYS,
  [SettingKeys.BILLING_MAX_URLS_PER_SITE]: process.env.MAX_URLS_PER_SITE,
  [SettingKeys.BILLING_CURRENCY]: process.env.BILLING_CURRENCY,
  [SettingKeys.STORAGE_MAX_FILE_SIZE_MB]: process.env.MAX_FILE_SIZE?.replace('mb', ''),
  [SettingKeys.STORAGE_UPLOAD_DIR]: process.env.UPLOAD_DIR,
};

// Default values for each setting
const DEFAULTS: Record<string, unknown> = {
  [SettingKeys.PLATFORM_NAME]: 'IntelliConvo',
  [SettingKeys.SUPPORT_EMAIL]: 'support@intelliconvo.com',
  [SettingKeys.MAINTENANCE_MODE]: false,
  [SettingKeys.AI_DEFAULT_MODEL]: 'gpt-4o-mini',
  [SettingKeys.AI_EMBEDDING_MODEL]: 'text-embedding-3-small',
  [SettingKeys.AI_TEMPERATURE]: 0.7,
  [SettingKeys.AI_MAX_TOKENS]: 4096,
  [SettingKeys.AI_MAX_RESPONSE_TOKENS]: 500,
  [SettingKeys.AI_MAX_HISTORY_TOKENS]: 1000,
  [SettingKeys.AI_MAX_CONTENT_CHUNK_TOKENS]: 400,
  [SettingKeys.AI_MAX_TOTAL_INPUT_TOKENS]: 3000,
  [SettingKeys.AI_VECTOR_SEARCH_TOP_K]: 3,
  [SettingKeys.AI_EMBEDDING_CHUNK_SIZE]: 500,
  [SettingKeys.AI_SYSTEM_PROMPT_DESCRIPTION_LIMIT]: 200,
  [SettingKeys.AI_SYSTEM_PROMPT_INSTRUCTIONS_LIMIT]: 150,
  [SettingKeys.SESSION_TIMEOUT_DAYS]: 7,
  [SettingKeys.REFRESH_TOKEN_DAYS]: 30,
  [SettingKeys.MAX_LOGIN_ATTEMPTS]: 5,
  [SettingKeys.AUTH_EMAIL_ENABLED]: true,
  [SettingKeys.AUTH_GOOGLE_ENABLED]: true,
  [SettingKeys.AUTH_GITHUB_ENABLED]: true,
  [SettingKeys.AUTH_MICROSOFT_ENABLED]: false,
  [SettingKeys.RATE_LIMIT_WINDOW_MS]: 60000,
  [SettingKeys.RATE_LIMIT_MAX_REQUESTS]: 100,
  [SettingKeys.AUTH_RATE_LIMIT_WINDOW_MS]: 900000,
  [SettingKeys.AUTH_RATE_LIMIT_MAX_REQUESTS]: 5,
  [SettingKeys.EMAIL_FROM_ADDRESS]: 'noreply@intelliconvo.ai',
  [SettingKeys.EMAIL_FROM_NAME]: 'IntelliConvo',
  [SettingKeys.EMAIL_PROVIDER]: 'auto',
  [SettingKeys.EMAIL_VERIFICATION_ENABLED]: false,
  [SettingKeys.BILLING_TRIAL_DAYS]: 2,
  [SettingKeys.BILLING_MAX_URLS_PER_SITE]: 500,
  [SettingKeys.BILLING_CURRENCY]: 'USD',
  [SettingKeys.STORAGE_MAX_FILE_SIZE_MB]: 10,
  [SettingKeys.STORAGE_UPLOAD_DIR]: 'uploads',
};

/**
 * Parse a string value to its proper type
 */
function parseValue(value: string, type: SettingType): unknown {
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
 * Get a setting value from cache, database, or fallback
 */
export async function getSetting<T>(key: string): Promise<T> {
  const now = Date.now();

  // Check cache first
  const cached = settingsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  try {
    // Fetch from database
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (setting) {
      const parsed = parseValue(setting.value, setting.type);
      settingsCache.set(key, { value: parsed, expiresAt: now + CACHE_TTL_MS });
      return parsed as T;
    }
  } catch (error) {
    // Database might not be available during startup
    console.warn(`Failed to fetch setting ${key} from database:`, error);
  }

  // Fall back to environment variable
  const envValue = ENV_FALLBACKS[key];
  if (envValue !== undefined) {
    return envValue as T;
  }

  // Return default value
  return DEFAULTS[key] as T;
}

/**
 * Get multiple settings at once (more efficient)
 */
export async function getSettings<T extends Record<string, unknown>>(
  keys: string[]
): Promise<T> {
  const now = Date.now();
  const result: Record<string, unknown> = {};
  const keysToFetch: string[] = [];

  // Check cache first
  for (const key of keys) {
    const cached = settingsCache.get(key);
    if (cached && cached.expiresAt > now) {
      result[key] = cached.value;
    } else {
      keysToFetch.push(key);
    }
  }

  // Fetch remaining from database
  if (keysToFetch.length > 0) {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: keysToFetch } },
      });

      for (const setting of settings) {
        const parsed = parseValue(setting.value, setting.type);
        settingsCache.set(setting.key, { value: parsed, expiresAt: now + CACHE_TTL_MS });
        result[setting.key] = parsed;
      }

      // Fill in any missing keys with env fallbacks or defaults
      for (const key of keysToFetch) {
        if (!(key in result)) {
          const envValue = ENV_FALLBACKS[key];
          result[key] = envValue !== undefined ? envValue : DEFAULTS[key];
        }
      }
    } catch (error) {
      console.warn('Failed to fetch settings from database:', error);
      // Fall back to env/defaults for all keys
      for (const key of keysToFetch) {
        const envValue = ENV_FALLBACKS[key];
        result[key] = envValue !== undefined ? envValue : DEFAULTS[key];
      }
    }
  }

  return result as T;
}

/**
 * Clear the settings cache (useful after updates)
 */
export function clearSettingsCache(): void {
  settingsCache.clear();
}

/**
 * Clear a specific setting from cache
 */
export function invalidateSetting(key: string): void {
  settingsCache.delete(key);
}

// Convenience functions for common settings
export const settings = {
  // AI Settings
  async getAIModel(): Promise<string> {
    return getSetting<string>(SettingKeys.AI_DEFAULT_MODEL);
  },

  async getEmbeddingModel(): Promise<string> {
    return getSetting<string>(SettingKeys.AI_EMBEDDING_MODEL);
  },

  async getAIMaxTokens(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_MAX_TOKENS);
  },

  async getAITemperature(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_TEMPERATURE);
  },

  async getAIMaxResponseTokens(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_MAX_RESPONSE_TOKENS);
  },

  async getAIMaxHistoryTokens(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_MAX_HISTORY_TOKENS);
  },

  async getAIMaxContentChunkTokens(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_MAX_CONTENT_CHUNK_TOKENS);
  },

  async getAIMaxTotalInputTokens(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_MAX_TOTAL_INPUT_TOKENS);
  },

  async getAIVectorSearchTopK(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_VECTOR_SEARCH_TOP_K);
  },

  async getAIEmbeddingChunkSize(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_EMBEDDING_CHUNK_SIZE);
  },

  async getAISystemPromptDescriptionLimit(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_SYSTEM_PROMPT_DESCRIPTION_LIMIT);
  },

  async getAISystemPromptInstructionsLimit(): Promise<number> {
    return getSetting<number>(SettingKeys.AI_SYSTEM_PROMPT_INSTRUCTIONS_LIMIT);
  },

  // Security Settings
  async getSessionTimeoutDays(): Promise<number> {
    return getSetting<number>(SettingKeys.SESSION_TIMEOUT_DAYS);
  },

  async getRefreshTokenDays(): Promise<number> {
    return getSetting<number>(SettingKeys.REFRESH_TOKEN_DAYS);
  },

  async getMaxLoginAttempts(): Promise<number> {
    return getSetting<number>(SettingKeys.MAX_LOGIN_ATTEMPTS);
  },

  // Rate Limiting
  async getRateLimitWindowMs(): Promise<number> {
    return getSetting<number>(SettingKeys.RATE_LIMIT_WINDOW_MS);
  },

  async getRateLimitMaxRequests(): Promise<number> {
    return getSetting<number>(SettingKeys.RATE_LIMIT_MAX_REQUESTS);
  },

  async getAuthRateLimitWindowMs(): Promise<number> {
    return getSetting<number>(SettingKeys.AUTH_RATE_LIMIT_WINDOW_MS);
  },

  async getAuthRateLimitMaxRequests(): Promise<number> {
    return getSetting<number>(SettingKeys.AUTH_RATE_LIMIT_MAX_REQUESTS);
  },

  // Email
  async getFromEmail(): Promise<string> {
    return getSetting<string>(SettingKeys.EMAIL_FROM_ADDRESS);
  },

  async getFromName(): Promise<string> {
    return getSetting<string>(SettingKeys.EMAIL_FROM_NAME);
  },

  async getEmailProvider(): Promise<string> {
    return getSetting<string>(SettingKeys.EMAIL_PROVIDER);
  },

  async isEmailVerificationEnabled(): Promise<boolean> {
    return getSetting<boolean>(SettingKeys.EMAIL_VERIFICATION_ENABLED);
  },

  // Billing & Trial
  async getTrialDays(): Promise<number> {
    return getSetting<number>(SettingKeys.BILLING_TRIAL_DAYS);
  },

  async getMaxUrlsPerSite(): Promise<number> {
    return getSetting<number>(SettingKeys.BILLING_MAX_URLS_PER_SITE);
  },

  async getCurrency(): Promise<string> {
    return getSetting<string>(SettingKeys.BILLING_CURRENCY);
  },

  // Storage
  async getMaxFileSizeMB(): Promise<number> {
    return getSetting<number>(SettingKeys.STORAGE_MAX_FILE_SIZE_MB);
  },

  async getUploadDir(): Promise<string> {
    return getSetting<string>(SettingKeys.STORAGE_UPLOAD_DIR);
  },

  // General
  async getPlatformName(): Promise<string> {
    return getSetting<string>(SettingKeys.PLATFORM_NAME);
  },

  async getSupportEmail(): Promise<string> {
    return getSetting<string>(SettingKeys.SUPPORT_EMAIL);
  },

  async isMaintenanceMode(): Promise<boolean> {
    return getSetting<boolean>(SettingKeys.MAINTENANCE_MODE);
  },

  // Auth Providers
  async isEmailAuthEnabled(): Promise<boolean> {
    return getSetting<boolean>(SettingKeys.AUTH_EMAIL_ENABLED);
  },

  async isGoogleAuthEnabled(): Promise<boolean> {
    return getSetting<boolean>(SettingKeys.AUTH_GOOGLE_ENABLED);
  },

  async isGitHubAuthEnabled(): Promise<boolean> {
    return getSetting<boolean>(SettingKeys.AUTH_GITHUB_ENABLED);
  },

  async isMicrosoftAuthEnabled(): Promise<boolean> {
    return getSetting<boolean>(SettingKeys.AUTH_MICROSOFT_ENABLED);
  },

  async getEnabledAuthProviders(): Promise<string[]> {
    const [email, google, github, microsoft] = await Promise.all([
      getSetting<boolean>(SettingKeys.AUTH_EMAIL_ENABLED),
      getSetting<boolean>(SettingKeys.AUTH_GOOGLE_ENABLED),
      getSetting<boolean>(SettingKeys.AUTH_GITHUB_ENABLED),
      getSetting<boolean>(SettingKeys.AUTH_MICROSOFT_ENABLED),
    ]);

    const providers: string[] = [];
    if (email) providers.push('email');
    if (google) providers.push('google');
    if (github) providers.push('github');
    if (microsoft) providers.push('microsoft');
    return providers;
  },

  async isAuthProviderEnabled(provider: string): Promise<boolean> {
    switch (provider.toLowerCase()) {
      case 'email':
        return getSetting<boolean>(SettingKeys.AUTH_EMAIL_ENABLED);
      case 'google':
        return getSetting<boolean>(SettingKeys.AUTH_GOOGLE_ENABLED);
      case 'github':
        return getSetting<boolean>(SettingKeys.AUTH_GITHUB_ENABLED);
      case 'microsoft':
        return getSetting<boolean>(SettingKeys.AUTH_MICROSOFT_ENABLED);
      default:
        return false;
    }
  },
};
