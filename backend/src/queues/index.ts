import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { crawlWebsite, crawlSingleUrl } from '../services/crawler';
import { processSiteEmbeddingsParallel, EmbeddingProgress, UrlCompletionCallbacks } from '../services/embeddings';
import { htmlToText } from '../utils/textProcessor';
import { prisma } from '../lib/prisma';
import { CrawlStatus, UrlEmbeddingStatus, NotificationType, EmailStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { getIO } from '../services/socket';
import { siteService } from '../services/site/SiteService';
import { emailService } from '../services/email/EmailService';
import { EmailTemplateData } from '../services/email/templates';

// Redis connection options
const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Create queues
export const crawlQueue = new Queue('crawl', {
  connection: redisConnection,
});

export const embeddingQueue = new Queue('embedding', {
  connection: redisConnection,
});

export const emailQueue = new Queue('email', {
  connection: redisConnection,
});

export const notificationQueue = new Queue('notification', {
  connection: redisConnection,
});

export const cleanupQueue = new Queue('cleanup', {
  connection: redisConnection,
});

// Crawl worker
const crawlWorker = new Worker('crawl', async (job) => {
  const { type, siteId, url, urls } = job.data;

  try {
    if (type === 'full') {
      await crawlWebsite(siteId);
    } else if (type === 'single') {
      await crawlSingleUrl(siteId, url);
    } else if (type === 'selective') {
      // Import dynamically to avoid circular deps
      const { crawlSelectiveUrls } = await import('../services/crawler');
      await crawlSelectiveUrls(siteId, urls);
    }

    logger.info(`Crawl job completed: ${type} for site ${siteId}`);
    return { success: true, siteId, type };
  } catch (error) {
    logger.error(`Crawl job failed: ${type} for site ${siteId}`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2,              // Reduced to prevent resource contention
  lockDuration: 300000,        // 5 minutes - prevents premature lock expiration
  stalledInterval: 60000,      // Check for stalls every 60s (default is 30s)
});

// Embedding worker - processes embeddings for a site after payment (OPTIMIZED with parallel processing)
const embeddingWorker = new Worker('embedding', async (job) => {
  const { siteId, userId } = job.data;

  try {
    logger.info(`Starting optimized embedding generation for site ${siteId}`);

    // Get the site info
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { siteName: true, siteUrl: true },
    });

    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    // Update site status to PROCESSING
    await prisma.site.update({
      where: { id: siteId },
      data: { crawlStatus: CrawlStatus.PROCESSING },
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`site:${siteId}`).emit('crawl-status-update', {
        siteId,
        crawlStatus: CrawlStatus.PROCESSING,
      });
    }

    // Create notification that setup has started
    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.INFO,
        title: 'Setting up your assistant',
        message: `We're preparing your AI assistant for ${site.siteName}. This usually takes a few minutes.`,
        siteId,
        link: `/sites/${siteId}`,
      },
    });

    // Emit notification to user
    if (io) {
      io.to(`user:${userId}`).emit('notification', {
        type: 'info',
        title: 'Setting up your assistant',
        message: `We're preparing your AI assistant for ${site.siteName}.`,
      });
    }

    // Get all URLs that need embedding generation
    const urls = await prisma.siteUrl.findMany({
      where: {
        siteId,
        embeddingStatus: UrlEmbeddingStatus.SCRAPED,
        isExcluded: false,
      },
    });

    if (urls.length === 0) {
      logger.info(`No URLs to process for site ${siteId}`);
      await prisma.site.update({
        where: { id: siteId },
        data: { crawlStatus: CrawlStatus.READY },
      });
      return { success: true, siteId, successCount: 0, failCount: 0 };
    }

    // Update all URLs to PENDING status
    await prisma.siteUrl.updateMany({
      where: {
        siteId,
        embeddingStatus: UrlEmbeddingStatus.SCRAPED,
        isExcluded: false,
      },
      data: { embeddingStatus: UrlEmbeddingStatus.PENDING },
    });

    // Emit initial PENDING status for all URLs
    if (io) {
      io.to(`site:${siteId}`).emit('url-status-update', {
        siteId,
        urls: urls.map(u => ({ urlId: u.id, embeddingStatus: UrlEmbeddingStatus.PENDING })),
      });
    }

    // Prepare URL data for parallel processing
    const urlData = urls.map(url => ({
      id: url.id,
      url: url.url,
      content: htmlToText(url.htmlContent || url.content || ''),
    })).filter(u => u.content.trim().length > 0);

    // Progress callback to emit socket events
    const onProgress = (progress: EmbeddingProgress) => {
      if (io) {
        // Emit embedding progress (similar to crawl progress)
        io.to(`site:${siteId}`).emit('embedding-progress', {
          siteId,
          completed: progress.completed,
          total: progress.total,
          currentUrl: progress.currentUrl,
          estimatedSecondsRemaining: progress.estimatedSecondsRemaining,
          phase: 'embedding',
        });
      }
    };

    // Import cacheService for pause checking
    const { cacheService } = await import('../services/cache');

    // URL completion callbacks for progressive availability (real-time status updates)
    const urlCallbacks: UrlCompletionCallbacks = {
      onUrlSuccess: async (urlId: string) => {
        // Update URL status to READY immediately (enables progressive search)
        await prisma.siteUrl.update({
          where: { id: urlId },
          data: { embeddingStatus: UrlEmbeddingStatus.READY },
        });

        // Emit real-time status update so UI updates progressively
        if (io) {
          io.to(`site:${siteId}`).emit('url-status-update', {
            siteId,
            urls: [{ urlId, embeddingStatus: UrlEmbeddingStatus.READY }],
          });
        }
      },
      onUrlFailure: async (urlId: string, errorMessage?: string) => {
        // Update URL status to FAILED with error tracking
        await prisma.siteUrl.update({
          where: { id: urlId },
          data: {
            embeddingStatus: UrlEmbeddingStatus.FAILED,
            lastError: errorMessage?.substring(0, 1000) || 'Unknown error', // Truncate long errors
            retryCount: { increment: 1 },
            lastRetryAt: new Date(),
          },
        });

        // Emit real-time status update
        if (io) {
          io.to(`site:${siteId}`).emit('url-status-update', {
            siteId,
            urls: [{ urlId, embeddingStatus: UrlEmbeddingStatus.FAILED }],
          });
        }
      },
      // Check if embedding should be paused
      shouldAbort: async () => {
        return await cacheService.isCrawlPaused(siteId);
      },
    };

    // Process embeddings in parallel with real-time callbacks
    const result = await processSiteEmbeddingsParallel(siteId, urlData, onProgress, urlCallbacks);

    // No need for bulk URL status updates - they're updated in real-time via callbacks

    // Determine final site status
    const finalStatus = result.failCount === 0
      ? CrawlStatus.READY
      : result.failCount === urls.length
        ? CrawlStatus.FAILED
        : CrawlStatus.PARTIAL;

    // Update site status
    await prisma.site.update({
      where: { id: siteId },
      data: { crawlStatus: finalStatus },
    });

    // Invalidate site cache so fresh data is served
    await siteService.invalidateSiteCacheById(siteId);

    // Create completion notification
    const notificationData = finalStatus === CrawlStatus.READY
      ? {
          type: NotificationType.SUCCESS,
          title: 'Your assistant is ready!',
          message: `Your AI assistant for ${site.siteName} is now ready to help your visitors.`,
        }
      : finalStatus === CrawlStatus.PARTIAL
        ? {
            type: NotificationType.WARNING,
            title: 'Assistant setup completed with issues',
            message: `Your assistant for ${site.siteName} is ready, but ${result.failCount} pages couldn't be processed.`,
          }
        : {
            type: NotificationType.ERROR,
            title: 'Assistant setup failed',
            message: `We couldn't set up your assistant for ${site.siteName}. Please try again or contact support.`,
          };

    await prisma.notification.create({
      data: {
        userId,
        ...notificationData,
        siteId,
        link: `/sites/${siteId}`,
      },
    });

    // Send site ready email (only for READY or PARTIAL status)
    if (finalStatus === CrawlStatus.READY || finalStatus === CrawlStatus.PARTIAL) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        });

        if (user) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

          await queueSiteReadyEmail(userId, user.email, {
            userName: user.fullName || '',
            email: user.email,
            siteName: site.siteName,
            siteUrl: site.siteUrl,
            dashboardUrl: `${frontendUrl}/sites/${siteId}`,
            widgetInstallUrl: `${frontendUrl}/sites/${siteId}?tab=widget`,
            pagesIndexed: result.successCount,
          });
          logger.info(`Queued site ready email for user ${userId}`);
        }
      } catch (emailError) {
        logger.error(`Failed to queue site ready email for user ${userId}:`, emailError);
      }
    }

    // Emit socket events
    if (io) {
      io.to(`site:${siteId}`).emit('crawl-status-update', {
        siteId,
        crawlStatus: finalStatus,
      });
      io.to(`user:${userId}`).emit('notification', {
        type: notificationData.type.toLowerCase(),
        title: notificationData.title,
        message: notificationData.message,
      });
    }

    logger.info(`Embedding generation completed for site ${siteId}. Success: ${result.successCount}, Failed: ${result.failCount}`);
    return { success: true, siteId, successCount: result.successCount, failCount: result.failCount };
  } catch (error) {
    logger.error(`Embedding job failed for site ${siteId}:`, error);

    // Update site status to FAILED
    await prisma.site.update({
      where: { id: siteId },
      data: { crawlStatus: CrawlStatus.FAILED },
    });

    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2, // Limit concurrent embedding jobs to avoid API rate limits
});

// Worker event handlers
crawlWorker.on('completed', (job) => {
  logger.info(`Crawl job ${job.id} completed`);
});

crawlWorker.on('failed', (job, err) => {
  logger.error(`Crawl job ${job?.id} failed:`, err);
});

embeddingWorker.on('completed', (job) => {
  logger.info(`Embedding job ${job.id} completed`);
});

embeddingWorker.on('failed', (job, err) => {
  logger.error(`Embedding job ${job?.id} failed:`, err);
});

// Email worker - processes email sending jobs
const emailWorker = new Worker('email', async (job) => {
  const { emailLogId, to, type, data, userId } = job.data;

  try {
    logger.info(`Processing email job: ${type} to ${to}`);

    // Update email log status to QUEUED
    if (emailLogId) {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: { status: EmailStatus.QUEUED },
      });
    }

    // Send the email using the email service
    await emailService.sendEmail({
      to,
      type,
      data,
      userId,
    });

    logger.info(`Email job completed: ${type} to ${to}`);
    return { success: true, to, type };
  } catch (error) {
    logger.error(`Email job failed: ${type} to ${to}`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 5, // Can send multiple emails concurrently
});

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed:`, err);
});

// Notification worker - processes delayed in-app notification jobs
const notificationWorker = new Worker('notification', async (job) => {
  const { userId, type, title, message, siteId, link } = job.data;

  try {
    logger.info(`Processing notification job: ${title} for user ${userId}`);

    await prisma.notification.create({
      data: {
        userId,
        type: type || NotificationType.INFO,
        title,
        message,
        siteId,
        link,
      },
    });

    logger.info(`Notification job completed: ${title} for user ${userId}`);
    return { success: true, userId, title };
  } catch (error) {
    logger.error(`Notification job failed: ${title} for user ${userId}`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 10,
});

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed:`, err);
});

// Cleanup worker - removes abandoned onboarding sites (no subscription after 24h)
const cleanupWorker = new Worker('cleanup', async (job) => {
  const { type } = job.data;

  if (type === 'abandoned-sites') {
    try {
      logger.info('Starting cleanup of abandoned onboarding sites...');

      // Find sites that:
      // 1. Have status AWAITING_PAYMENT (onboarding not completed)
      // 2. Were created more than 24 hours ago
      // 3. Have no subscription
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const abandonedSites = await prisma.site.findMany({
        where: {
          crawlStatus: CrawlStatus.AWAITING_PAYMENT,
          createdAt: { lt: twentyFourHoursAgo },
          subscription: null,
        },
        select: {
          id: true,
          siteUrl: true,
          userId: true,
          createdAt: true,
        },
      });

      if (abandonedSites.length === 0) {
        logger.info('No abandoned sites found for cleanup');
        return { success: true, deletedCount: 0 };
      }

      logger.info(`Found ${abandonedSites.length} abandoned site(s) to clean up`);

      // Delete each site (cascades to urls, embeddings, etc.)
      let deletedCount = 0;
      for (const site of abandonedSites) {
        try {
          // Delete vectors from Pinecone first (if any exist)
          // Note: During onboarding, embeddings aren't generated until after payment,
          // so this will typically be a no-op, but we call it for safety
          const { deleteSiteEmbeddings } = await import('../services/embeddings');
          await deleteSiteEmbeddings(site.id);

          // Delete site from database (cascades to related records)
          await prisma.site.delete({
            where: { id: site.id },
          });

          deletedCount++;
          logger.info(`Deleted abandoned site: ${site.siteUrl} (created ${site.createdAt.toISOString()})`);
        } catch (error) {
          logger.error(`Failed to delete abandoned site ${site.id}:`, error);
        }
      }

      logger.info(`Cleanup completed. Deleted ${deletedCount} abandoned site(s)`);
      return { success: true, deletedCount };
    } catch (error) {
      logger.error('Cleanup job failed:', error);
      throw error;
    }
  }

  return { success: false, error: 'Unknown cleanup type' };
}, {
  connection: redisConnection,
  concurrency: 1, // Run one cleanup at a time
});

cleanupWorker.on('completed', (job) => {
  logger.info(`Cleanup job ${job.id} completed`);
});

cleanupWorker.on('failed', (job, err) => {
  logger.error(`Cleanup job ${job?.id} failed:`, err);
});

// Export function to add crawl jobs to queue
export async function queueCrawl(siteId: string, type: 'full' | 'single' = 'full', url?: string) {
  const jobData: { type: string; siteId: string; url?: string } = { type, siteId };
  if (url) jobData.url = url;

  await crawlQueue.add('crawl-site', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

// Export function to add selective crawl jobs to queue
export async function queueSelectiveCrawl(siteId: string, urls: string[]) {
  await crawlQueue.add('crawl-site', {
    type: 'selective',
    siteId,
    urls,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  logger.info(`Queued selective crawl for site ${siteId} with ${urls.length} URLs`);
}

// Export function to add embedding jobs to queue (called after payment)
export async function queueEmbeddingGeneration(siteId: string, userId: string) {
  await embeddingQueue.add('generate-embeddings', { siteId, userId }, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });

  logger.info(`Queued embedding generation for site ${siteId}`);
}

// Export function to queue email sending
export async function queueEmail<T extends keyof EmailTemplateData>(
  to: string,
  type: T,
  data: EmailTemplateData[T],
  userId?: string,
  options?: { delay?: number; priority?: number }
) {
  const { delay, priority } = options || {};

  await emailQueue.add('send-email', {
    to,
    type,
    data,
    userId,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10 seconds
    },
    delay,
    priority,
  });

  logger.info(`Queued email: ${type} to ${to}`);
}

// Convenience functions for common email types
export async function queueWelcomeEmail(
  userId: string,
  email: string,
  userName: string,
  loginUrl: string,
  verificationUrl?: string // Optional: include to prompt email verification
) {
  await queueEmail(email, 'WELCOME', {
    userName,
    email,
    loginUrl,
    verificationUrl,
    verificationExpiresInHours: verificationUrl ? 24 : undefined,
  }, userId);
}

export async function queueVerificationEmail(
  userId: string,
  email: string,
  userName: string,
  verificationUrl: string,
  expiresInHours = 24
) {
  await queueEmail(email, 'EMAIL_VERIFICATION', {
    userName,
    email,
    verificationUrl,
    expiresInHours,
  }, userId);
}

export async function queuePasswordResetEmail(
  userId: string,
  email: string,
  userName: string,
  resetUrl: string,
  expiresInMinutes = 60
) {
  await queueEmail(email, 'PASSWORD_RESET', {
    userName,
    email,
    resetUrl,
    expiresInMinutes,
  }, userId);
}

export async function queueSubscriptionEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['SUBSCRIPTION_ACTIVATED']
) {
  await queueEmail(email, 'SUBSCRIPTION_ACTIVATED', data, userId);
}

export async function queuePaymentFailedEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['PAYMENT_FAILED']
) {
  await queueEmail(email, 'PAYMENT_FAILED', data, userId, { priority: 1 }); // High priority
}

export async function queueSiteReadyEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['SITE_READY']
) {
  await queueEmail(email, 'SITE_READY', data, userId);
}

export async function queueTrialExpiringEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['TRIAL_EXPIRING'],
  delayMs?: number
) {
  await queueEmail(email, 'TRIAL_EXPIRING', data, userId, { delay: delayMs });
}

export async function queueRefundConfirmationEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['REFUND_CONFIRMATION']
) {
  await queueEmail(email, 'REFUND_CONFIRMATION', data, userId);
}

export async function queueDisputeAlertEmail(
  adminEmail: string,
  data: EmailTemplateData['DISPUTE_ALERT']
) {
  // Dispute alerts are sent to admins, high priority
  await queueEmail(adminEmail, 'DISPUTE_ALERT', data, undefined, { priority: 1 });
}

export async function queueSubscriptionCancelledEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['SUBSCRIPTION_CANCELLED']
) {
  await queueEmail(email, 'SUBSCRIPTION_CANCELLED', data, userId);
}

export async function queueSiteDeletedEmail(
  userId: string,
  email: string,
  data: EmailTemplateData['SITE_DELETED']
) {
  await queueEmail(email, 'SITE_DELETED', data, userId);
}

/**
 * Queue a delayed in-app notification
 * Used for scheduling notifications to be created at a future time
 */
export async function queueDelayedNotification(
  data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    siteId?: string;
    link?: string;
  },
  delayMs?: number
) {
  await notificationQueue.add('create-notification', data, {
    delay: delayMs,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });

  logger.info(`Queued notification: "${data.title}" for user ${data.userId}${delayMs ? ` (delayed ${Math.round(delayMs / 1000 / 60)} minutes)` : ''}`);
}

export async function setupQueues() {
  logger.info('Background job queues initialized with BullMQ');

  // Schedule recurring cleanup job for abandoned onboarding sites
  // Runs every hour to clean up sites that have been in AWAITING_PAYMENT for 24+ hours
  try {
    await cleanupQueue.add(
      'cleanup-abandoned-sites',
      { type: 'abandoned-sites' },
      {
        repeat: {
          pattern: '0 * * * *', // Every hour at minute 0
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      }
    );
    logger.info('🧹 Scheduled hourly cleanup job for abandoned onboarding sites');
  } catch (error) {
    logger.error('Failed to schedule cleanup job:', error);
  }
}