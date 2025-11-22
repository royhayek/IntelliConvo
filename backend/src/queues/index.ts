import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { crawlWebsite, crawlSingleUrl } from '../services/crawler';
import { generateEmbeddings } from '../services/embeddings';
import { htmlToText } from '../utils/textProcessor';
import { prisma } from '../lib/prisma';
import { CrawlStatus, UrlEmbeddingStatus, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';
import { getIO } from '../services/socket';
import { siteService } from '../services/site/SiteService';

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

// Crawl worker
const crawlWorker = new Worker('crawl', async (job) => {
  const { type, siteId, url } = job.data;

  try {
    if (type === 'full') {
      await crawlWebsite(siteId);
    } else if (type === 'single') {
      await crawlSingleUrl(siteId, url);
    }

    logger.info(`Crawl job completed: ${type} for site ${siteId}`);
    return { success: true, siteId, type };
  } catch (error) {
    logger.error(`Crawl job failed: ${type} for site ${siteId}`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 3,
});

// Embedding worker - processes embeddings for a site after payment
const embeddingWorker = new Worker('embedding', async (job) => {
  const { siteId, userId } = job.data;

  try {
    logger.info(`Starting embedding generation for site ${siteId}`);

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

    // Update all URLs to PENDING status
    await prisma.siteUrl.updateMany({
      where: {
        siteId,
        embeddingStatus: UrlEmbeddingStatus.SCRAPED,
        isExcluded: false,
      },
      data: { embeddingStatus: UrlEmbeddingStatus.PENDING },
    });

    let successCount = 0;
    let failCount = 0;

    // Emit initial PENDING status for all URLs
    if (io) {
      io.to(`site:${siteId}`).emit('url-status-update', {
        siteId,
        urls: urls.map(u => ({ urlId: u.id, embeddingStatus: UrlEmbeddingStatus.PENDING })),
      });
    }

    // Process each URL
    for (const url of urls) {
      try {
        // Update to PROCESSING
        await prisma.siteUrl.update({
          where: { id: url.id },
          data: { embeddingStatus: UrlEmbeddingStatus.PROCESSING },
        });

        // Emit PROCESSING status
        if (io) {
          io.to(`site:${siteId}`).emit('url-status-update', {
            siteId,
            urls: [{ urlId: url.id, embeddingStatus: UrlEmbeddingStatus.PROCESSING }],
          });
        }

        // Generate embeddings
        const textContent = htmlToText(url.htmlContent || url.content || '');
        if (textContent.trim()) {
          await generateEmbeddings(url.id, textContent);
        }

        // Update to READY
        await prisma.siteUrl.update({
          where: { id: url.id },
          data: { embeddingStatus: UrlEmbeddingStatus.READY },
        });

        // Emit READY status
        if (io) {
          io.to(`site:${siteId}`).emit('url-status-update', {
            siteId,
            urls: [{ urlId: url.id, embeddingStatus: UrlEmbeddingStatus.READY }],
          });
        }

        successCount++;
        logger.debug(`Generated embeddings for URL ${url.id} (${successCount}/${urls.length})`);
      } catch (error) {
        // Update to FAILED
        await prisma.siteUrl.update({
          where: { id: url.id },
          data: { embeddingStatus: UrlEmbeddingStatus.FAILED },
        });

        // Emit FAILED status
        if (io) {
          io.to(`site:${siteId}`).emit('url-status-update', {
            siteId,
            urls: [{ urlId: url.id, embeddingStatus: UrlEmbeddingStatus.FAILED }],
          });
        }

        failCount++;
        logger.error(`Failed to generate embeddings for URL ${url.id}:`, error);
      }
    }

    // Determine final site status
    const finalStatus = failCount === 0
      ? CrawlStatus.READY
      : failCount === urls.length
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
            message: `Your assistant for ${site.siteName} is ready, but ${failCount} pages couldn't be processed.`,
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

    logger.info(`Embedding generation completed for site ${siteId}. Success: ${successCount}, Failed: ${failCount}`);
    return { success: true, siteId, successCount, failCount };
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

export function setupQueues() {
  logger.info('Background job queues initialized with BullMQ');
}