import { z } from 'zod';
import { logger } from '../utils/logger';

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('5000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  // Pinecone
  PINECONE_API_KEY: z.string().min(1, 'PINECONE_API_KEY is required'),
  PINECONE_INDEX_NAME: z.string().default('intelligentconvo'),
  PINECONE_DIMENSIONS: z.string().transform(Number).pipe(z.number().int().positive()).default('512'),

  // External URLs
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  WIDGET_CDN_URL: z.string().url().optional(),

  // OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Stripe (Optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PREMIUM_ANNUAL_PRICE_ID: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'), // 15 minutes
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('5'),

  // File Upload
  MAX_FILE_SIZE: z.string().default('10mb'),
  UPLOAD_DIR: z.string().default('uploads'),
});

export type Config = z.infer<typeof configSchema>;

let config: Config | null = null;

/**
 * Initialize and validate configuration from environment variables
 * This should be called at application startup before any other code runs
 */
export function initializeConfig(): Config {
  try {
    const result = configSchema.safeParse(process.env);

    if (!result.success) {
      console.error('❌ Configuration validation failed:');
      console.error('');

      // Format errors for better readability
      const errors = result.error.format();
      Object.keys(errors).forEach((key) => {
        if (key !== '_errors') {
          const error = (errors as any)[key];
          if (error._errors && error._errors.length > 0) {
            console.error(`  • ${key}: ${error._errors.join(', ')}`);
          }
        }
      });

      console.error('');
      console.error('Please check your .env file and ensure all required variables are set correctly.');
      process.exit(1);
    }

    config = result.data;

    // Log configuration summary (excluding sensitive data)
    logger.info('✅ Configuration validated successfully', {
      nodeEnv: config.NODE_ENV,
      port: config.PORT,
      hasDatabase: !!config.DATABASE_URL,
      hasRedis: !!config.REDIS_HOST,
      hasOpenAI: !!config.OPENAI_API_KEY,
      hasPinecone: !!config.PINECONE_API_KEY,
      hasGoogleOAuth: !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET),
      hasGitHubOAuth: !!(config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET),
      hasStripe: !!config.STRIPE_SECRET_KEY,
    });

    return config;
  } catch (error) {
    console.error('❌ Fatal error during configuration initialization:', error);
    process.exit(1);
  }
}

/**
 * Get the current configuration
 * Throws an error if configuration hasn't been initialized
 */
export function getConfig(): Config {
  if (!config) {
    throw new Error(
      'Configuration not initialized. Call initializeConfig() before accessing config.'
    );
  }
  return config;
}

/**
 * Check if a specific feature is enabled based on configuration
 */
export function isFeatureEnabled(feature: keyof Config): boolean {
  const cfg = getConfig();
  const value = cfg[feature];
  return value !== undefined && value !== null && value !== '';
}

/**
 * Get allowed origins for CORS based on environment
 */
export function getAllowedOrigins(): string[] {
  const cfg = getConfig();
  const origins = [cfg.FRONTEND_URL];

  if (cfg.WIDGET_CDN_URL) {
    origins.push(cfg.WIDGET_CDN_URL);
  }

  // Add development origins in non-production
  if (cfg.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      // Backend server origin (needed for Swagger UI)
      `http://localhost:${cfg.PORT}`,
      `http://127.0.0.1:${cfg.PORT}`
    );
  }

  return [...new Set(origins)]; // Remove duplicates
}
