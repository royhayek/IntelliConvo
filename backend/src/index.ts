import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { initializePassport } from './config/passport';
import { initializeSocketIO } from './services/socket';
import { setupQueues } from './queues';
import { setupSwagger } from './config/swagger';

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

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // Also allows file:// URLs for local testing
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        process.env.WIDGET_CDN_URL || 'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5500', // Live Server
        'http://localhost:5500',
      ];

      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

// Initialize Passport
initializePassport(passport);

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.WIDGET_CDN_URL || 'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
    ];

    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Webhook routes (before express.json middleware)
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Passport middleware
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Setup Swagger documentation
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
  logger.info('Swagger documentation available at /api/docs');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/sites/:siteId/urls', urlsRoutes);
app.use('/api/sites/:siteId/files', filesRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/widget', widgetRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-12-07T10:30:00.000Z
 *               required:
 *                 - status
 *                 - timestamp
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize Socket.IO
initializeSocketIO(io);

// Initialize background job queues
setupQueues();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

export { app, io };