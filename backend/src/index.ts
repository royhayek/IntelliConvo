import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import passport from 'passport';

// Load environment variables first
dotenv.config();

// Initialize and validate configuration
import { initializeConfig, getConfig, getAllowedOrigins } from './config';
initializeConfig();

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { correlationIdMiddleware } from './middleware/correlationId';
import { requestLogger, performanceLogger } from './middleware/requestLogger';
import { createGlobalRateLimiter } from './middleware/rateLimiter';
import { performanceTracker, metricsEndpoint } from './middleware/performance';
import { maintenanceMiddleware } from './middleware/maintenance';

// Utilities and services
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { initializePassport } from './config/passport';
import { initializeSocketIO } from './services/socket';
import { setupQueues } from './queues';
import { setupSwagger } from './config/swagger';
import { cacheService, CacheNamespace } from './services/cache';
import { settings } from './lib/settings';
import { emailService } from './services/email/EmailService';
import IORedis from 'ioredis';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Routes
import authRoutes from './routes/auth';
import sitesRoutes from './routes/sites';
import urlsRoutes from './routes/urls';
import filesRoutes from './routes/files';
import conversationsRoutes from './routes/conversations';
import subscriptionsRoutes from './routes/subscriptions';
import accountRoutes from './routes/account';
import billingRoutes from './routes/billing';
import webhookRoutes from './routes/webhooks';
import widgetRoutes from './routes/widget';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import configRoutes from './routes/config';

// Get validated configuration
const config = getConfig();
const allowedOrigins = getAllowedOrigins();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with consolidated CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: async (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured admin/frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // For widget connections, we use a more permissive approach here
      // because the actual origin validation happens at the application level:
      // 1. Widget validates via /widget/:siteId/validate endpoint before loading
      // 2. Socket middleware validates origin against site's activeHosts (see below)
      // 3. Message handlers validate siteId and permissions
      //
      // Socket.IO CORS is primarily for browser security, not authorization.
      // The real security is enforced at the application/business logic level.
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Initialize Passport
initializePassport(passport);

// Setup Swagger documentation FIRST - before ANY other middleware
// This ensures swagger-ui static files are served without any interference
// from helmet, cors, performanceTracker, or requestLogger
if (config.NODE_ENV !== 'production') {
  setupSwagger(app);
  logger.info('📚 Swagger documentation available at /api/docs');
}

// Security middleware with Swagger UI-compatible CSP
app.use(helmet({
  contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS middleware (consolidated configuration)
// Note: Widget routes have their own CORS middleware that validates against site's activeHosts
app.use((req, res, next) => {
  const origin = req.get('Origin');

  // Skip global CORS for widget routes - they have custom CORS middleware
  if (req.path.startsWith('/api/v1/widget') || req.path.startsWith('/api/widget')) {
    return next();
  }

  // Apply standard CORS for non-widget routes
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin
      if (!requestOrigin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
  })(req, res, next);
});

// Request tracking and performance middleware (AFTER Swagger to avoid res.end conflicts)
app.use(correlationIdMiddleware);
app.use(performanceTracker); // Track all request performance
app.use(requestLogger);

// Webhook routes (before body parsing middleware to allow raw body access)
app.use('/api/v1/webhooks', webhookRoutes);

// Body parsing middleware - use generous limit, actual validation in fileProcessor
const bodyParserLimit = process.env.MAX_FILE_SIZE || '100mb';
app.use(express.json({ limit: bodyParserLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyParserLimit }));

// Static file serving for uploads with CORS support
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Add CORS headers for uploads
const uploadsCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};

app.use('/uploads', uploadsCorsMiddleware, express.static(uploadDir));
// Also serve uploads under /api/v1/uploads for consistency with API routes
app.use('/api/v1/uploads', uploadsCorsMiddleware, express.static(uploadDir));

// Passport middleware
app.use(passport.initialize());

// Global rate limiting
const globalLimiter = createGlobalRateLimiter();
app.use('/api/', globalLimiter);

// Maintenance mode check (after auth so admin users can be identified)
app.use('/api/', maintenanceMiddleware);

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sites', sitesRoutes);
app.use('/api/v1/sites/:siteId/urls', urlsRoutes);
app.use('/api/v1/sites/:siteId/files', filesRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/billing/subscriptions', subscriptionsRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/widget', widgetRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/config', configRoutes);

// Backwards compatibility: redirect /api/* to /api/v1/*
app.use('/api', (req, res, next) => {
  // Skip if already on v1 or if it's a special route
  if (req.path.startsWith('/v1') || req.path === '/docs' || req.path.startsWith('/docs/')) {
    return next();
  }
  // Redirect to v1
  const newPath = `/api/v1${req.path}`;
  res.redirect(307, newPath); // 307 preserves HTTP method
});

app.get('/health', async (req, res) => {
  const platformName = await settings.getPlatformName();
  res.json({
    status: 'healthy',
    platform: platformName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Performance metrics
 *     description: Returns performance metrics and statistics
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Performance metrics
 */
app.get('/metrics', metricsEndpoint);

app.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();
  const platformName = await settings.getPlatformName();

  const checks = {
    status: 'healthy',
    platform: platformName,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: { status: 'unknown', responseTime: 0, error: null as string | null },
      redis: { status: 'unknown', responseTime: 0, error: null as string | null },
      openai: { status: 'unknown', responseTime: 0, error: null as string | null },
      pinecone: { status: 'unknown', responseTime: 0, error: null as string | null },
    },
    system: {
      memory: {
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
        external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)}MB`,
      },
      cpu: process.cpuUsage(),
    },
  };

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database.status = 'healthy';
    checks.services.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    checks.services.database.status = 'unhealthy';
    checks.services.database.error = error instanceof Error ? error.message : 'Unknown error';
    checks.status = 'degraded';
    logger.error('Database health check failed:', error);
  }

  // Check Redis
  if (config.REDIS_HOST && config.REDIS_PORT) {
    try {
      const redisStart = Date.now();
      const redis = new IORedis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        lazyConnect: true,
        connectTimeout: 5000,
      });

      await redis.connect();
      await redis.ping();
      checks.services.redis.status = 'healthy';
      checks.services.redis.responseTime = Date.now() - redisStart;
      await redis.quit();
    } catch (error) {
      checks.services.redis.status = 'unhealthy';
      checks.services.redis.error = error instanceof Error ? error.message : 'Unknown error';
      checks.status = 'degraded';
      logger.error('Redis health check failed:', error);
    }
  } else {
    checks.services.redis.status = 'not_configured';
  }

  // Check OpenAI (optional - may be slow)
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
    try {
      const openaiStart = Date.now();
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      await openai.models.list();
      checks.services.openai.status = 'healthy';
      checks.services.openai.responseTime = Date.now() - openaiStart;
    } catch (error) {
      checks.services.openai.status = 'unhealthy';
      checks.services.openai.error = error instanceof Error ? error.message : 'Unknown error';
      checks.status = 'degraded';
      logger.error('OpenAI health check failed:', error);
    }
  } else {
    checks.services.openai.status = 'not_configured';
  }

  // Check Pinecone (optional - may be slow)
  if (
    process.env.PINECONE_API_KEY &&
    process.env.PINECONE_API_KEY !== 'your_pinecone_api_key_here' &&
    process.env.PINECONE_INDEX_NAME
  ) {
    try {
      const pineconeStart = Date.now();
      const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
      await index.describeIndexStats();
      checks.services.pinecone.status = 'healthy';
      checks.services.pinecone.responseTime = Date.now() - pineconeStart;
    } catch (error) {
      checks.services.pinecone.status = 'unhealthy';
      checks.services.pinecone.error = error instanceof Error ? error.message : 'Unknown error';
      checks.status = 'degraded';
      logger.error('Pinecone health check failed:', error);
    }
  } else {
    checks.services.pinecone.status = 'not_configured';
  }

  // Add total check duration
  const totalDuration = Date.now() - startTime;
  (checks as any).checkDuration = `${totalDuration}ms`;

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO
initializeSocketIO(io);

// Initialize background job queues
setupQueues().catch((error) => {
  logger.error('Failed to setup background job queues:', error);
});

// Initialize email service
emailService.initialize().then(() => {
  const provider = emailService.getProvider();
  logger.info(`📧 Email service initialized with provider: ${provider?.name || 'none'}`);
}).catch((error) => {
  logger.warn('📧 Email service initialization failed (emails may not work):', error.message);
});

// Start server
const PORT = config.PORT;

httpServer.listen(PORT, async () => {
  logger.info('='.repeat(50));
  logger.info(`🚀 Server started successfully`);
  logger.info(`📍 Port: ${PORT}`);
  logger.info(`🌍 Environment: ${config.NODE_ENV}`);
  logger.info(`🔗 Allowed origins: ${allowedOrigins.length}`);
  logger.info('='.repeat(50));

  // Clear stale site cache on startup (one-time cleanup)
  try {
    await cacheService.deleteNamespace(CacheNamespace.SITE_CONFIG);
    logger.info('🧹 Cleared site cache on startup');
  } catch (error) {
    logger.warn('Failed to clear site cache on startup:', error);
  }
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} signal received: starting graceful shutdown`);

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Close Socket.IO connections
    io.close();
    logger.info('Socket.IO connections closed');

    // Disconnect token blacklist service
    const { tokenBlacklist } = await import('./services/tokenBlacklist');
    await tokenBlacklist.disconnect();
    logger.info('Token blacklist service disconnected');

    // Disconnect cache service
    const { cacheService } = await import('./services/cache');
    await cacheService.disconnect();
    logger.info('Cache service disconnected');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

export { app, io };