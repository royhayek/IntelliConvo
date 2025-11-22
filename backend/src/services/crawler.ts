import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import pLimit from 'p-limit';
import { prisma } from '../lib/prisma';
import { CrawlStatus, UrlEmbeddingStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { getIO } from './socket';
import { cacheService, CacheNamespace } from './cache';

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  htmlContent: string;
  links: string[];
}

interface CrawlerConfig {
  maxPages: number;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
  requestDelay: number;
  timeout: number;
  maxContentSize: number;
}

const DEFAULT_CONFIG: CrawlerConfig = {
  maxPages: 100,
  concurrency: 3,          // Parallel page crawls (reduced to prevent connection issues)
  retryAttempts: 3,        // Retry failed pages
  retryDelay: 2000,        // Delay between retries (ms)
  requestDelay: 1000,      // Delay between requests (ms)
  timeout: 45000,          // Page load timeout (ms)
  maxContentSize: 100000,  // Max content size (chars)
};

// File extensions to skip during crawling
const SKIP_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.ogg', '.wav',
  '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.css', '.js', '.json', '.xml', '.txt', '.csv',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.exe', '.dmg', '.iso', '.apk'
];

// URL patterns to skip
const SKIP_PATTERNS = [
  /^mailto:/i,
  /^tel:/i,
  /^javascript:/i,
  /^#/,
  /^data:/i,
  /^ftp:/i,
  /\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|mp3|mp4|avi|mov|wmv|flv|webm|zip|rar|tar|gz|7z|doc|docx|xls|xlsx|ppt|pptx|css|js|json|woff|woff2|ttf|eot)(\?.*)?$/i,
  /\/feed\/?$/i,
  /\/rss\/?$/i,
  /\/atom\/?$/i,
  /\?.*utm_/i,  // Skip tracking URLs
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/cart/i,
  /\/checkout/i,
  /\/login/i,
  /\/logout/i,
  /\/register/i,
  /\/account/i,
];

// User agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

/**
 * Normalize a URL by removing fragments, trailing slashes, and standardizing format
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove fragment
    urlObj.hash = '';
    // Convert to lowercase hostname
    urlObj.hostname = urlObj.hostname.toLowerCase();
    // Remove trailing slash from pathname (except for root)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    // Remove common tracking parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(param => {
      urlObj.searchParams.delete(param);
    });
    // Sort remaining query parameters for consistency
    urlObj.searchParams.sort();
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if a URL should be skipped based on extension or pattern
 */
function shouldSkipUrl(url: string): boolean {
  // Check against skip patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }

  // Check file extension
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    for (const ext of SKIP_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return true;
      }
    }
  } catch {
    return true;
  }

  return false;
}

/**
 * Check if URL is valid and belongs to the same domain
 */
function isValidUrl(url: string, baseDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(`https://${baseDomain}`);

    // Only crawl same domain (with www variation)
    const urlHost = urlObj.hostname.replace(/^www\./, '');
    const baseHost = baseObj.hostname.replace(/^www\./, '');

    return urlHost === baseHost;
  } catch {
    return false;
  }
}

/**
 * Fetch and parse sitemap.xml to discover URLs
 */
async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  const sitemapUrls: string[] = [];
  const sitemapsToCheck = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
    `${baseUrl}/sitemaps/sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapsToCheck) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': USER_AGENTS[0]
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Check if it's a sitemap index
      const sitemapLocs = $('sitemap loc');
      if (sitemapLocs.length > 0) {
        // It's a sitemap index, fetch each sitemap
        const nestedPromises = [];
        for (let i = 0; i < Math.min(sitemapLocs.length, 10); i++) { // Limit to 10 nested sitemaps
          const nestedSitemapUrl = $(sitemapLocs[i]).text().trim();
          nestedPromises.push(
            fetch(nestedSitemapUrl, {
              headers: { 'User-Agent': USER_AGENTS[0] }
            })
            .then(async (res) => {
              if (res.ok) {
                const nestedXml = await res.text();
                const nested$ = cheerio.load(nestedXml, { xmlMode: true });
                const urls: string[] = [];
                nested$('url loc').each((_, el) => {
                  const url = nested$(el).text().trim();
                  if (url) urls.push(url);
                });
                return urls;
              }
              return [];
            })
            .catch(() => [])
          );
        }

        const results = await Promise.all(nestedPromises);
        results.forEach(urls => sitemapUrls.push(...urls));
      } else {
        // It's a regular sitemap
        $('url loc').each((_, el) => {
          const url = $(el).text().trim();
          if (url) sitemapUrls.push(url);
        });
      }

      if (sitemapUrls.length > 0) {
        logger.info(`Found ${sitemapUrls.length} URLs from sitemap`);
        break;
      }
    } catch (error) {
      logger.debug(`No sitemap found at ${sitemapUrl}`);
    }
  }

  return sitemapUrls;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get random user agent
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Extract content using Mozilla Readability for better results
 */
function extractWithReadability(html: string, url: string): { title: string; content: string; htmlContent: string } {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
      keepClasses: false,
    });

    const article = reader.parse();

    if (article) {
      return {
        title: article.title || '',
        content: article.textContent || '',
        htmlContent: article.content || '',
      };
    }
  } catch (error) {
    logger.debug(`Readability extraction failed for ${url}: ${error}`);
  }

  // Fallback to basic extraction
  return extractBasic(html);
}

/**
 * Basic content extraction fallback
 */
function extractBasic(html: string): { title: string; content: string; htmlContent: string } {
  const $ = cheerio.load(html);

  // Extract title
  const title = $('title').text() || $('h1').first().text() || '';

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, iframe, noscript, [role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navigation, .menu, .sidebar, .footer, .header, .advertisement, .ad, .ads, .social-share, .comments').remove();

  // Get main content area if exists
  let mainContent = $('main, article, [role="main"], .content, .main-content, #content, #main').first();
  if (mainContent.length === 0) {
    mainContent = $('body');
  }

  // Extract text content
  const content = mainContent
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  // Get cleaned HTML
  const htmlContent = mainContent.html() || '';

  return { title, content, htmlContent };
}

/**
 * Crawl a single page with retry logic
 */
async function crawlPageWithRetry(
  browser: Browser,
  url: string,
  config: CrawlerConfig
): Promise<CrawlResult | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      const result = await crawlPage(browser, url, config);
      return result;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt}/${config.retryAttempts} failed for ${url}: ${lastError.message}`);

      if (attempt < config.retryAttempts) {
        await sleep(config.retryDelay * attempt); // Exponential backoff
      }
    }
  }

  logger.error(`All ${config.retryAttempts} attempts failed for ${url}: ${lastError?.message}`);
  return null;
}

/**
 * Crawl a single page
 */
async function crawlPage(browser: Browser, url: string, config: CrawlerConfig): Promise<CrawlResult> {
  const page = await browser.newPage();

  try {
    // Set random user agent
    await page.setUserAgent(getRandomUserAgent());

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: config.timeout,
    });

    // Wait a bit for any dynamic content
    await sleep(1000);

    // Get the full HTML
    const html = await page.content();

    // Extract content using Readability
    const { title, content, htmlContent } = extractWithReadability(html, url);

    // Extract links from the original HTML (not the Readability output)
    const $ = cheerio.load(html);
    const links: string[] = [];

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString();
          links.push(absoluteUrl);
        } catch {
          // Ignore invalid URLs
        }
      }
    });

    // Limit content size
    const truncatedContent = content.substring(0, config.maxContentSize);
    const truncatedHtml = htmlContent.substring(0, config.maxContentSize * 2);

    return {
      url,
      title: title.substring(0, 500), // Limit title length
      content: truncatedContent,
      htmlContent: truncatedHtml,
      links: [...new Set(links)], // Deduplicate links
    };
  } finally {
    await page.close();
  }
}

/**
 * Initialize crawl: Load site and update status
 */
async function initializeCrawl(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    throw new Error(`Site ${siteId} not found`);
  }

  logger.info(`Starting optimized crawl for site ${site.siteUrl}`);

  await prisma.site.update({
    where: { id: siteId },
    data: { crawlStatus: CrawlStatus.CRAWLING },
  });

  // Emit socket event to notify frontend that crawl has started
  const io = getIO();
  if (io) {
    io.to(`site:${siteId}`).emit('crawl-status-update', {
      siteId,
      crawlStatus: CrawlStatus.CRAWLING,
    });
    logger.debug(`Emitted crawl-status-update (CRAWLING) for site ${siteId}`);
  }

  return site;
}

/**
 * Setup crawl queue: Fetch sitemap or start with base URL
 */
async function setupCrawlQueue(baseUrl: string, siteUrl: string) {
  const toVisit: string[] = [];
  const visited = new Set<string>();

  // Try to get URLs from sitemap first
  const sitemapUrls = await fetchSitemapUrls(baseUrl);

  if (sitemapUrls.length > 0) {
    // Filter and normalize sitemap URLs
    for (const url of sitemapUrls) {
      if (isValidUrl(url, siteUrl) && !shouldSkipUrl(url)) {
        const normalizedUrl = normalizeUrl(url);
        if (!visited.has(normalizedUrl)) {
          toVisit.push(normalizedUrl);
          visited.add(normalizedUrl);
        }
      }
    }
    visited.clear();
    logger.info(`Added ${toVisit.length} URLs from sitemap to crawl queue`);
  } else {
    // No sitemap, start with base URL
    toVisit.push(normalizeUrl(baseUrl));
    logger.info(`No sitemap found, starting crawl from base URL`);
  }

  return { toVisit, sitemapUrls };
}

/**
 * Launch browser with optimized settings
 */
async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
    ],
  });
}

/**
 * Process a single URL in the crawl queue
 */
async function processCrawlUrl(
  browser: Browser,
  url: string,
  siteId: string,
  siteUrl: string,
  config: CrawlerConfig,
  usingSitemap: boolean,
  toVisit: string[],
  visited: Set<string>,
  failed: string[],
  processedCount: { count: number }
): Promise<void> {
  const normalizedUrl = normalizeUrl(url);

  if (visited.has(normalizedUrl)) {
    return;
  }

  visited.add(normalizedUrl);

  // Rate limiting
  await sleep(config.requestDelay);

  processedCount.count++;
  logger.debug(`Crawling page ${processedCount.count}/${config.maxPages}: ${normalizedUrl}`);

  const result = await crawlPageWithRetry(browser, normalizedUrl, config);

  if (result) {
    // Save to database
    await saveUrlToDatabase(siteId, result);

    // Add discovered links to queue (only if not using sitemap)
    if (!usingSitemap) {
      for (const link of result.links) {
        const normalizedLink = normalizeUrl(link);
        if (
          isValidUrl(link, siteUrl) &&
          !shouldSkipUrl(link) &&
          !visited.has(normalizedLink) &&
          !toVisit.includes(normalizedLink)
        ) {
          toVisit.push(normalizedLink);
        }
      }
    }
  } else {
    failed.push(normalizedUrl);
  }
}

/**
 * Process crawl batches with concurrency control
 */
async function processCrawlBatches(
  browser: Browser,
  siteId: string,
  siteUrl: string,
  toVisit: string[],
  visited: Set<string>,
  failed: string[],
  config: CrawlerConfig,
  usingSitemap: boolean
): Promise<void> {
  const limit = pLimit(config.concurrency);
  const processedCount = { count: 0 };

  while (toVisit.length > 0 && visited.size < config.maxPages) {
    // Get batch of URLs to process
    const batchSize = Math.min(
      config.concurrency * 2,
      config.maxPages - visited.size,
      toVisit.length
    );

    const batch = toVisit.splice(0, batchSize);

    // Process batch in parallel with concurrency limit
    const promises = batch.map(url =>
      limit(() =>
        processCrawlUrl(
          browser,
          url,
          siteId,
          siteUrl,
          config,
          usingSitemap,
          toVisit,
          visited,
          failed,
          processedCount
        )
      )
    );

    await Promise.all(promises);
  }
}

/**
 * Finalize crawl: Update status and log results
 * Sets status to AWAITING_PAYMENT (embeddings will be generated after payment)
 */
async function finalizeCrawl(
  siteId: string,
  siteUrl: string,
  visited: Set<string>,
  failed: string[]
): Promise<void> {
  const updatedSite = await prisma.site.update({
    where: { id: siteId },
    data: {
      crawlStatus: CrawlStatus.AWAITING_PAYMENT,
      lastCrawledAt: new Date(),
    },
    include: {
      _count: {
        select: { urls: true },
      },
    },
  });

  logger.info(
    `Completed crawl for site ${siteUrl}. Crawled ${visited.size} pages, ${failed.length} failed. Awaiting payment for embedding generation.`
  );

  // Invalidate site cache so frontend gets fresh data
  await cacheService.deleteByPattern(CacheNamespace.SITE_CONFIG, `${siteId}:*`);
  logger.debug(`Invalidated site cache for ${siteId}`);

  // Emit socket event to notify frontend of crawl completion
  const io = getIO();
  if (io) {
    io.to(`site:${siteId}`).emit('crawl-status-update', {
      siteId,
      crawlStatus: CrawlStatus.AWAITING_PAYMENT,
      urlCount: updatedSite._count.urls,
    });
    logger.debug(`Emitted crawl-status-update for site ${siteId}`);
  }
}

/**
 * Handle crawl error: Update status and log error
 */
async function handleCrawlError(siteId: string, error: unknown): Promise<void> {
  logger.error(`Crawl failed for site ${siteId}:`, error);

  await prisma.site.update({
    where: { id: siteId },
    data: { crawlStatus: CrawlStatus.FAILED },
  });

  // Invalidate site cache so frontend gets fresh data
  await cacheService.deleteByPattern(CacheNamespace.SITE_CONFIG, `${siteId}:*`);
  logger.debug(`Invalidated site cache for ${siteId}`);

  // Emit socket event to notify frontend of crawl failure
  const io = getIO();
  if (io) {
    io.to(`site:${siteId}`).emit('crawl-status-update', {
      siteId,
      crawlStatus: CrawlStatus.FAILED,
    });
    logger.debug(`Emitted crawl-status-update (FAILED) for site ${siteId}`);
  }
}

/**
 * Main crawl function - orchestrates the crawl process
 */
export async function crawlWebsite(
  siteId: string,
  customConfig?: Partial<CrawlerConfig>
): Promise<void> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  try {
    // Initialize crawl and load site
    const site = await initializeCrawl(siteId);
    const baseUrl = `https://${site.siteUrl}`;

    // Setup crawl queue from sitemap or base URL
    const { toVisit, sitemapUrls } = await setupCrawlQueue(baseUrl, site.siteUrl);

    // Initialize tracking sets
    const visited = new Set<string>();
    const failed: string[] = [];

    // Launch browser
    const browser = await launchBrowser();

    try {
      // Process all URLs in batches with concurrency control
      await processCrawlBatches(
        browser,
        siteId,
        site.siteUrl,
        toVisit,
        visited,
        failed,
        config,
        sitemapUrls.length > 0
      );
    } finally {
      await browser.close();
    }

    // Finalize crawl and update status
    await finalizeCrawl(siteId, site.siteUrl, visited, failed);
  } catch (error) {
    await handleCrawlError(siteId, error);
    throw error;
  }
}

/**
 * Save URL result to database (scrape only, no embeddings)
 * Embeddings are generated after payment is confirmed
 */
async function saveUrlToDatabase(siteId: string, result: CrawlResult): Promise<void> {
  const contentHash = crypto
    .createHash('md5')
    .update(result.content)
    .digest('hex');

  const existingUrl = await prisma.siteUrl.findFirst({
    where: { siteId, url: result.url },
  });

  if (existingUrl) {
    // Update if content changed
    if (existingUrl.contentHash !== contentHash) {
      await prisma.siteUrl.update({
        where: { id: existingUrl.id },
        data: {
          title: result.title,
          content: result.content,
          htmlContent: result.htmlContent,
          contentHash,
          lastCrawledAt: new Date(),
          embeddingStatus: UrlEmbeddingStatus.SCRAPED, // Reset to scraped, embeddings will be regenerated after payment
        },
      });

      // Delete old embeddings since content changed
      await prisma.embedding.deleteMany({
        where: { siteUrlId: existingUrl.id },
      });
    } else {
      // Just update last crawled time
      await prisma.siteUrl.update({
        where: { id: existingUrl.id },
        data: { lastCrawledAt: new Date() },
      });
    }
  } else {
    // Create new URL with SCRAPED status (no embeddings yet)
    await prisma.siteUrl.create({
      data: {
        siteId,
        url: result.url,
        title: result.title,
        content: result.content,
        htmlContent: result.htmlContent,
        contentHash,
        lastCrawledAt: new Date(),
        embeddingStatus: UrlEmbeddingStatus.SCRAPED,
      },
    });
  }
}

/**
 * Crawl a single URL (for manual URL additions)
 */
export async function crawlSingleUrl(siteId: string, urlToCrawl: string): Promise<void> {
  const config = DEFAULT_CONFIG;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const result = await crawlPageWithRetry(browser, urlToCrawl, config);

    if (result) {
      await saveUrlToDatabase(siteId, result);
      logger.info(`Successfully crawled single URL: ${urlToCrawl}`);
    } else {
      throw new Error(`Failed to crawl URL after ${config.retryAttempts} attempts`);
    }
  } finally {
    await browser.close();
  }
}
