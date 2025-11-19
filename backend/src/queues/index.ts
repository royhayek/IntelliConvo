import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { crawlWebsite, crawlSingleUrl } from '../services/crawler';
import { logger } from '../utils/logger';

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

// Create worker
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

// Worker event handlers
crawlWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

crawlWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

// Export function to add jobs to queue
export async function queueCrawl(siteId: string, type: 'full' | 'single' = 'full', url?: string) {
  const jobData: any = { type, siteId };
  if (url) jobData.url = url;

  await crawlQueue.add('crawl-site', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

export function setupQueues() {
  logger.info('Background job queues initialized with BullMQ');
}