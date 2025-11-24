import { PlaywrightCrawler, Configuration, purgeDefaultStorages } from 'crawlee';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { prisma } from '../lib/prisma';
import { CrawlStatus, UrlEmbeddingStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { getIO } from './socket';
import { cacheService, CacheNamespace } from './cache';
import { deleteEmbeddingsForUrls } from './embeddings';

// Track aborted crawlers by siteId
const abortedCrawlers = new Set<string>();

/**
 * Check if crawl should be aborted (paused)
 */
async function shouldAbortCrawl(siteId: string): Promise<boolean> {
  if (abortedCrawlers.has(siteId)) {
    return true;
  }
  const isPaused = await cacheService.isCrawlPaused(siteId);
  if (isPaused) {
    abortedCrawlers.add(siteId);
  }
  return isPaused;
}

/**
 * Clear abort flag for a site (called when resuming)
 */
export function clearAbortFlag(siteId: string): void {
  abortedCrawlers.delete(siteId);
}

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
  requestDelay: number;
  timeout: number;
  maxContentSize: number;
}

const DEFAULT_CONFIG: CrawlerConfig = {
  maxPages: 100,
  concurrency: 5,
  retryAttempts: 3,
  requestDelay: 500,
  timeout: 60000,       // Increased timeout for JS-heavy sites
  maxContentSize: 100000,
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
  /\?.*utm_/i,
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
    urlObj.hash = '';
    urlObj.hostname = urlObj.hostname.toLowerCase();
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(param => {
      urlObj.searchParams.delete(param);
    });
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
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }

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
        headers: { 'User-Agent': USER_AGENTS[0] },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Check if it's a sitemap index
      const sitemapLocs = $('sitemap loc');
      if (sitemapLocs.length > 0) {
        const nestedPromises = [];
        for (let i = 0; i < Math.min(sitemapLocs.length, 20); i++) { // Increased limit to 20
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
      charThreshold: 50,    // Lowered threshold to capture more content
      keepClasses: false,
    });

    const article = reader.parse();

    if (article && article.textContent && article.textContent.trim().length > 100) {
      return {
        title: article.title || '',
        content: article.textContent || '',
        htmlContent: article.content || '',
      };
    }
  } catch (error) {
    logger.debug(`Readability extraction failed for ${url}: ${error}`);
  }

  return extractBasic(html);
}

/**
 * Basic content extraction fallback - more aggressive extraction
 */
function extractBasic(html: string): { title: string; content: string; htmlContent: string } {
  const $ = cheerio.load(html);

  // Extract title
  const title = $('title').text() ||
                $('meta[property="og:title"]').attr('content') ||
                $('h1').first().text() || '';

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, iframe, noscript, svg, [role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navigation, .menu, .sidebar, .footer, .header, .advertisement, .ad, .ads, .social-share, .comments, .cookie-banner, .popup, .modal').remove();

  // Get main content area if exists
  let mainContent = $('main, article, [role="main"], .content, .main-content, #content, #main, .post-content, .entry-content, .article-content, .page-content').first();
  if (mainContent.length === 0 || mainContent.text().trim().length < 100) {
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
 * Enhanced content extraction with multiple strategies
 * Falls back to progressively more aggressive methods
 */
function extractContent(html: string, url: string): { title: string; content: string; htmlContent: string } {
  // Try Readability first
  const readabilityResult = extractWithReadability(html, url);

  // If Readability got good content, use it
  if (readabilityResult.content.trim().length > 500) {
    logger.debug(`Using Readability extraction: ${readabilityResult.content.length} chars`);
    return readabilityResult;
  }

  // Try basic extraction
  const basicResult = extractBasic(html);

  // If basic got good content, use it
  if (basicResult.content.length > 500) {
    logger.debug(`Using basic extraction: ${basicResult.content.length} chars`);
    return basicResult;
  }

  // Last resort: extract ALL text from body (most aggressive)
  const $ = cheerio.load(html);
  const title = $('title').text() ||
                $('meta[property="og:title"]').attr('content') ||
                $('h1').first().text() || '';

  // Remove only scripts and styles, keep everything else
  $('script, style, noscript').remove();

  // Get ALL body text
  const fullBodyText = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  logger.debug(`Using full body extraction: ${fullBodyText.length} chars`);

  // Return whichever has more content
  const results = [
    { source: 'readability', ...readabilityResult },
    { source: 'basic', ...basicResult },
    { source: 'fullBody', title, content: fullBodyText, htmlContent: $('body').html() || '' }
  ];

  const best = results.reduce((a, b) => a.content.length > b.content.length ? a : b);
  logger.debug(`Best extraction method: ${best.source} with ${best.content.length} chars`);

  return { title: best.title, content: best.content, htmlContent: best.htmlContent };
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

  logger.info(`Starting Crawlee-powered crawl for site ${site.siteUrl}`);

  await prisma.site.update({
    where: { id: siteId },
    data: { crawlStatus: CrawlStatus.CRAWLING },
  });

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
 * Finalize crawl: Update status and log results
 */
async function finalizeCrawl(
  siteId: string,
  siteUrl: string,
  crawledCount: number,
  failedCount: number
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
    `Completed crawl for site ${siteUrl}. Crawled ${crawledCount} pages, ${failedCount} failed. Awaiting payment for embedding generation.`
  );

  await cacheService.deleteByPattern(CacheNamespace.SITE_CONFIG, `${siteId}:*`);
  logger.debug(`Invalidated site cache for ${siteId}`);

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

  await cacheService.deleteByPattern(CacheNamespace.SITE_CONFIG, `${siteId}:*`);
  logger.debug(`Invalidated site cache for ${siteId}`);

  const io = getIO();
  if (io) {
    io.to(`site:${siteId}`).emit('crawl-status-update', {
      siteId,
      crawlStatus: CrawlStatus.FAILED,
    });
    logger.debug(`Emitted crawl-status-update (FAILED) for site ${siteId}`);
  }
}

interface PreparedCrawlResult extends CrawlResult {
  contentHash: string;
}

function prepareCrawlResult(result: CrawlResult): PreparedCrawlResult {
  return {
    ...result,
    contentHash: crypto.createHash('md5').update(result.content).digest('hex'),
  };
}

/**
 * Batch save URL results to database
 */
async function batchSaveUrlsToDatabase(siteId: string, results: CrawlResult[]): Promise<void> {
  if (results.length === 0) return;

  const preparedResults = results.map(prepareCrawlResult);
  const urls = preparedResults.map(r => r.url);
  const now = new Date();

  const existingUrls = await prisma.siteUrl.findMany({
    where: { siteId, url: { in: urls } },
    select: { id: true, url: true, contentHash: true },
  });

  const existingUrlMap = new Map(existingUrls.map(u => [u.url, u]));

  const toCreate: PreparedCrawlResult[] = [];
  const toUpdate: { id: string; result: PreparedCrawlResult }[] = [];
  const toTouch: string[] = [];
  const embeddingsToDelete: string[] = [];

  for (const result of preparedResults) {
    const existing = existingUrlMap.get(result.url);
    if (!existing) {
      toCreate.push(result);
    } else if (existing.contentHash !== result.contentHash) {
      toUpdate.push({ id: existing.id, result });
      embeddingsToDelete.push(existing.id);
    } else {
      toTouch.push(existing.id);
    }
  }

  if (embeddingsToDelete.length > 0) {
    await deleteEmbeddingsForUrls(embeddingsToDelete);
  }

  await prisma.$transaction(async (tx) => {
    if (toCreate.length > 0) {
      await tx.siteUrl.createMany({
        data: toCreate.map(r => ({
          siteId,
          url: r.url,
          title: r.title,
          content: r.content,
          htmlContent: r.htmlContent,
          contentHash: r.contentHash,
          lastCrawledAt: now,
          embeddingStatus: UrlEmbeddingStatus.SCRAPED,
        })),
      });
    }

    for (const { id, result } of toUpdate) {
      await tx.siteUrl.update({
        where: { id },
        data: {
          title: result.title,
          content: result.content,
          htmlContent: result.htmlContent,
          contentHash: result.contentHash,
          lastCrawledAt: now,
          embeddingStatus: UrlEmbeddingStatus.SCRAPED,
        },
      });
    }

    if (toTouch.length > 0) {
      await tx.siteUrl.updateMany({
        where: { id: { in: toTouch } },
        data: { lastCrawledAt: now },
      });
    }

    if (embeddingsToDelete.length > 0) {
      await tx.embedding.deleteMany({
        where: { siteUrlId: { in: embeddingsToDelete } },
      });
    }
  });

  logger.debug(`Batch saved ${results.length} URLs: ${toCreate.length} created, ${toUpdate.length} updated, ${toTouch.length} unchanged`);
}

/**
 * Main crawl function using Crawlee's PlaywrightCrawler
 */
export async function crawlWebsite(
  siteId: string,
  customConfig?: Partial<CrawlerConfig>
): Promise<void> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  // Disable Crawlee's default storage to avoid file system clutter
  Configuration.getGlobalConfig().set('persistStorage', false);

  try {
    const site = await initializeCrawl(siteId);
    const baseUrl = `https://${site.siteUrl}`;

    // Collect results for batch saving
    const crawlResults: CrawlResult[] = [];
    let crawledCount = 0;
    let failedCount = 0;
    const visited = new Set<string>();

    // Get URLs from sitemap
    const sitemapUrls = await fetchSitemapUrls(baseUrl);
    const usingSitemap = sitemapUrls.length > 0;

    // Prepare initial URLs
    const initialUrls: string[] = [];
    if (usingSitemap) {
      for (const url of sitemapUrls) {
        if (isValidUrl(url, site.siteUrl) && !shouldSkipUrl(url)) {
          const normalizedUrl = normalizeUrl(url);
          if (!visited.has(normalizedUrl) && initialUrls.length < config.maxPages) {
            initialUrls.push(normalizedUrl);
            visited.add(normalizedUrl);
          }
        }
      }
      logger.info(`Using ${initialUrls.length} URLs from sitemap`);
    } else {
      initialUrls.push(normalizeUrl(baseUrl));
      visited.add(normalizeUrl(baseUrl));
      logger.info(`No sitemap found, starting from base URL`);
    }

    const totalUrls = Math.min(initialUrls.length || 1, config.maxPages);

    // Create the Playwright crawler
    const crawler = new PlaywrightCrawler({
      maxConcurrency: config.concurrency,
      maxRequestRetries: config.retryAttempts,
      navigationTimeoutSecs: config.timeout / 1000,
      requestHandlerTimeoutSecs: config.timeout / 1000,

      // Use Chromium with stealth settings
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
          ],
        },
      },

      // Pre-navigation hook to set up the page
      preNavigationHooks: [
        async ({ page }) => {
          // Set random user agent
          await page.setExtraHTTPHeaders({
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          });

          // Set viewport
          await page.setViewportSize({ width: 1920, height: 1080 });

          // Block heavy resources but keep CSS (might hide content via CSS)
          await page.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            if (['image', 'media', 'font'].includes(resourceType)) {
              route.abort();
            } else {
              route.continue();
            }
          });
        },
      ],

      // Main request handler
      requestHandler: async ({ page, request, enqueueLinks }) => {
        const url = request.loadedUrl || request.url;
        const normalizedUrl = normalizeUrl(url);

        // Skip if we've hit max pages
        if (crawledCount >= config.maxPages) {
          return;
        }

        logger.debug(`Crawling: ${normalizedUrl}`);

        try {
          // Wait for the page to be fully loaded with multiple strategies
          await page.waitForLoadState('domcontentloaded');

          // Wait for network to be mostly idle (allows up to 2 connections)
          try {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
          } catch {
            // Network idle timeout is OK, continue with content
            logger.debug(`Network idle timeout for ${normalizedUrl}, continuing...`);
          }

          // Additional wait for JavaScript frameworks to hydrate
          await page.waitForTimeout(1500);

          // Scroll down to trigger lazy loading
          await autoScroll(page);

          // Expand all accordions, FAQs, and collapsed content - captures innerText and innerHTML immediately
          const { count: expandedCount, innerText: innerTextContent, innerHTML: expandedHtmlContent } = await expandAllAccordions(page);
          if (expandedCount > 0) {
            logger.debug(`Expanded ${expandedCount} accordion/collapsible elements on ${normalizedUrl}`);
          }

          // Wait a bit more after expanding for any remaining animations
          await page.waitForTimeout(500);

          // Get the page content
          const html = await page.content();

          // Extract content
          let { title, content, htmlContent } = extractContent(html, normalizedUrl);

          // Prefer innerText when accordions were expanded, as it captures revealed content
          // that standard HTML extraction often misses (due to display:none in raw HTML)
          if (expandedCount > 0 && innerTextContent.length > 500) {
            logger.debug(`Using innerText (${innerTextContent.length} chars) for ${normalizedUrl} - ${expandedCount} accordions expanded`);
            content = innerTextContent.replace(/\s+/g, ' ').trim();
            // Also use the expanded HTML for htmlContent so preview shows accordion content
            htmlContent = expandedHtmlContent;
          } else if (innerTextContent.length > content.length * 1.2) {
            // Also use innerText if it's significantly larger
            logger.debug(`Using innerText (${innerTextContent.length} chars) for ${normalizedUrl} - more than standard extraction`);
            content = innerTextContent.replace(/\s+/g, ' ').trim();
            htmlContent = expandedHtmlContent;
          }

          // Only save if we got meaningful content
          if (content.trim().length > 50) {
            const result: CrawlResult = {
              url: normalizedUrl,
              title: title.substring(0, 500),
              content: content.substring(0, config.maxContentSize),
              htmlContent: htmlContent.substring(0, config.maxContentSize * 2),
              links: [],
            };

            crawlResults.push(result);
            crawledCount++;

            // Emit progress
            const io = getIO();
            if (io) {
              io.to(`site:${siteId}`).emit('crawl-progress', {
                siteId,
                crawled: crawledCount,
                total: totalUrls,
                currentUrl: normalizedUrl,
              });
            }

            // Batch save every 10 results
            if (crawlResults.length >= 10) {
              await batchSaveUrlsToDatabase(siteId, crawlResults);
              crawlResults.length = 0;
            }

            logger.debug(`Crawled ${normalizedUrl} (${content.length} chars)`);
          } else {
            logger.warn(`No meaningful content found at ${normalizedUrl}`);
            failedCount++;
          }

          // Enqueue discovered links (only if not using sitemap)
          if (!usingSitemap && crawledCount < config.maxPages) {
            await enqueueLinks({
              strategy: 'same-domain',
              transformRequestFunction: (req) => {
                const linkUrl = normalizeUrl(req.url);

                // Skip if already visited or should skip
                if (visited.has(linkUrl) || shouldSkipUrl(req.url) || !isValidUrl(req.url, site.siteUrl)) {
                  return false;
                }

                // Check max pages
                if (visited.size >= config.maxPages) {
                  return false;
                }

                visited.add(linkUrl);
                req.url = linkUrl;
                return req;
              },
            });
          }
        } catch (error) {
          logger.error(`Error processing ${normalizedUrl}:`, error);
          failedCount++;
        }
      },

      // Handle failed requests
      failedRequestHandler: async ({ request }) => {
        logger.error(`Failed to crawl ${request.url} after ${config.retryAttempts} retries`);
        failedCount++;
      },
    });

    // Run the crawler
    await crawler.run(initialUrls);

    // Save any remaining results
    if (crawlResults.length > 0) {
      await batchSaveUrlsToDatabase(siteId, crawlResults);
    }

    await finalizeCrawl(siteId, site.siteUrl, crawledCount, failedCount);
  } catch (error) {
    await handleCrawlError(siteId, error);
    throw error;
  }
}

/**
 * Auto-scroll function to trigger lazy loading
 */
async function autoScroll(page: import('playwright').Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const maxScrolls = 10; // Limit scrolling to prevent infinite loops
      let scrollCount = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;

        if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
          clearInterval(timer);
          // Scroll back to top
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * Expand and reveal all hidden content on the page
 * This is a comprehensive, framework-agnostic solution that handles:
 * - MUI Accordions
 * - Bootstrap Accordions/Collapse
 * - Elementor Accordions (WordPress)
 * - HTML5 details/summary
 * - Any aria-hidden or display:none content
 * - Custom accordion implementations
 *
 * Strategy:
 * 1. Reveal hidden content by modifying DOM/styles (fastest, no clicking needed)
 * 2. Open HTML5 details elements
 * 3. Click interactive elements for frameworks that require interaction
 */
async function expandAllAccordions(page: import('playwright').Page): Promise<{ count: number; innerText: string; innerHTML: string }> {
  // Strategy 1: Reveal all hidden accordion/collapsible content via DOM manipulation
  // This is the fastest approach - most frameworks keep content in DOM but hidden
  // Returns both count and innerText captured IMMEDIATELY after modifications
  const result = await page.evaluate(() => {
    let count = 0;

    // Comprehensive list of selectors for hidden accordion/collapsible content
    // These cover MUI, Bootstrap, Elementor, Tailwind, and custom implementations
    const hiddenContentSelectors = [
      // MUI (Material-UI)
      '.MuiAccordionDetails-root',
      '.MuiCollapse-root',
      '.MuiCollapse-hidden',
      // Bootstrap
      '.collapse:not(.show)',
      '.accordion-collapse:not(.show)',
      '.accordion-body',
      // Elementor (WordPress) - multiple variations
      '.ui-e-acc-panel',
      '.ui-e-accordion-content',
      '.ui-e-content',
      '.elementor-tab-content',
      '.elementor-accordion-content',
      '.elementor-accordion-item-content',
      // Tailwind UI / Headless UI
      '[data-headlessui-state="closed"]',
      // Common patterns
      '[class*="accordion-content"]',
      '[class*="accordion-panel"]',
      '[class*="accordion-body"]',
      '[class*="collapse-content"]',
      '[class*="faq-answer"]',
      '[class*="faq-content"]',
      '[class*="faq-body"]',
      '[class*="expandable-content"]',
      '[class*="panel-content"]',
      '[class*="tab-content"]',
      '[class*="tab-panel"]',
      // ARIA patterns
      '[role="region"][aria-hidden="true"]',
      '[role="tabpanel"][hidden]',
    ];

    // Reveal content by modifying styles
    hiddenContentSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach((el) => {
          const htmlEl = el as HTMLElement;
          const computedStyle = window.getComputedStyle(htmlEl);
          const isHidden =
            computedStyle.display === 'none' ||
            computedStyle.visibility === 'hidden' ||
            computedStyle.height === '0px' ||
            htmlEl.hasAttribute('hidden') ||
            htmlEl.getAttribute('aria-hidden') === 'true';

          // Only reveal if has meaningful content
          if (isHidden && htmlEl.textContent && htmlEl.textContent.trim().length > 10) {
            htmlEl.style.setProperty('display', 'block', 'important');
            htmlEl.style.setProperty('visibility', 'visible', 'important');
            htmlEl.style.setProperty('height', 'auto', 'important');
            htmlEl.style.setProperty('overflow', 'visible', 'important');
            htmlEl.style.setProperty('opacity', '1', 'important');
            htmlEl.style.setProperty('max-height', 'none', 'important');
            htmlEl.removeAttribute('hidden');
            htmlEl.setAttribute('aria-hidden', 'false');

            // Also add 'show' class for Bootstrap
            if (htmlEl.classList.contains('collapse')) {
              htmlEl.classList.add('show');
            }

            count++;
          }
        });
      } catch {
        // Selector may be invalid
      }
    });

    // Handle elements hidden via inline styles - CRITICAL for Elementor and similar frameworks
    // Use a lower threshold (15 chars) since individual accordion panels may have short content
    document.querySelectorAll('[style*="display: none"], [style*="display:none"], [style*="height: 0"], [style*="height:0"]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const tagName = htmlEl.tagName.toLowerCase();
      const text = htmlEl.textContent?.trim() || '';

      // Skip obvious UI elements but be more permissive with content
      const isModal = htmlEl.classList.contains('modal') || htmlEl.classList.contains('popup') ||
                      htmlEl.classList.contains('overlay') || htmlEl.id.includes('modal');
      const isContent = text.length > 15 ||
                        htmlEl.classList.contains('ui-e-accordion-content') ||
                        htmlEl.classList.contains('ui-e-content') ||
                        htmlEl.classList.contains('accordion-content') ||
                        htmlEl.classList.contains('faq-answer') ||
                        tagName === 'p' || tagName === 'div' || tagName === 'section';

      if (!isModal && isContent) {
        htmlEl.style.setProperty('display', 'block', 'important');
        htmlEl.style.setProperty('height', 'auto', 'important');
        htmlEl.style.setProperty('visibility', 'visible', 'important');
        htmlEl.style.setProperty('overflow', 'visible', 'important');
        htmlEl.style.setProperty('max-height', 'none', 'important');
        htmlEl.style.setProperty('opacity', '1', 'important');
        count++;
      }
    });

    // Specifically target Elementor accordion content regardless of computed style
    // Elementor uses inline styles that may not be caught by computedStyle checks
    // Use setProperty with 'important' to override CSS rules with higher specificity
    document.querySelectorAll('.ui-e-accordion-content, .ui-e-content, .elementor-tab-content, .elementor-accordion-content').forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Force reveal with !important to override any CSS rules
      htmlEl.style.setProperty('display', 'block', 'important');
      htmlEl.style.setProperty('height', 'auto', 'important');
      htmlEl.style.setProperty('visibility', 'visible', 'important');
      htmlEl.style.setProperty('overflow', 'visible', 'important');
      htmlEl.style.setProperty('max-height', 'none', 'important');
      htmlEl.style.setProperty('opacity', '1', 'important');
      htmlEl.style.setProperty('position', 'static', 'important');
      count++;
    });

    // Reveal aria-hidden content with substantial text
    document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || '';
      // Only reveal if it's content (not icons/decorations)
      if (text.length > 30 && !htmlEl.querySelector('svg') && !htmlEl.classList.contains('icon')) {
        htmlEl.setAttribute('aria-hidden', 'false');
        htmlEl.style.setProperty('display', 'block', 'important');
        htmlEl.style.setProperty('visibility', 'visible', 'important');
        count++;
      }
    });

    // Capture innerText and innerHTML IMMEDIATELY after all modifications, before browser can re-render
    const innerText = document.body.innerText;

    // Also capture innerHTML of main content area for htmlContent
    // This preserves our style modifications for proper display
    const mainContent = document.querySelector('main, article, [role="main"], .content, #content, body');
    const innerHTML = mainContent ? mainContent.innerHTML : document.body.innerHTML;

    return { count, innerText, innerHTML };
  });

  let totalExpanded = result.count;
  const capturedInnerText = result.innerText;
  const capturedInnerHTML = result.innerHTML;

  // Strategy 2: Open HTML5 details elements (must be done programmatically)
  const detailsExpanded = await page.evaluate(() => {
    const details = document.querySelectorAll('details:not([open])');
    let count = 0;
    details.forEach((el) => {
      (el as HTMLDetailsElement).open = true;
      count++;
    });
    return count;
  });
  totalExpanded += detailsExpanded;

  // Strategy 3: Click accordion triggers for frameworks that require interaction
  // Some frameworks lazy-load content only when clicked
  const clickSelectors = [
    // Bootstrap
    '[data-bs-toggle="collapse"]:not([aria-expanded="true"])',
    '[data-toggle="collapse"]:not([aria-expanded="true"])',
    '.accordion-button.collapsed',
    // Generic accordion triggers
    '.accordion-trigger:not([aria-expanded="true"])',
    '.accordion-header:not(.active)',
    '[role="button"][aria-expanded="false"]',
    // Tab triggers
    '.tab-trigger:not(.active)',
    '[role="tab"]:not([aria-selected="true"])',
  ];

  for (const selector of clickSelectors) {
    const elements = await page.$$(selector);
    for (const el of elements.slice(0, 10)) { // Limit to 10 per selector for speed
      try {
        await el.click();
        totalExpanded++;
        await page.waitForTimeout(25); // Reduced from 50ms
      } catch {
        // Element may not be clickable or already expanded
      }
    }
  }

  // Brief wait for any animations
  await page.waitForTimeout(200); // Reduced from 300ms

  return { count: totalExpanded, innerText: capturedInnerText, innerHTML: capturedInnerHTML };
}

/**
 * Crawl a single URL (for manual URL additions or recrawl)
 */
export async function crawlSingleUrl(siteId: string, urlToCrawl: string): Promise<void> {
  const config = DEFAULT_CONFIG;

  // Disable Crawlee's default storage and purge to avoid URL deduplication
  Configuration.getGlobalConfig().set('persistStorage', false);
  Configuration.getGlobalConfig().set('purgeOnStart', true);

  // Explicitly purge all default storages to ensure the URL is not skipped due to deduplication
  await purgeDefaultStorages();

  // Update URL status to SCRAPING at the start
  const existingUrl = await prisma.siteUrl.findFirst({
    where: { siteId, url: urlToCrawl },
    select: { id: true },
  });

  if (existingUrl) {
    await prisma.siteUrl.update({
      where: { id: existingUrl.id },
      data: { embeddingStatus: UrlEmbeddingStatus.SCRAPING },
    });

    const io = getIO();
    if (io) {
      io.to(`site:${siteId}`).emit('url-status-update', {
        siteId,
        urls: [{ urlId: existingUrl.id, embeddingStatus: UrlEmbeddingStatus.SCRAPING }],
      });
      logger.debug(`Emitted SCRAPING status for URL ${existingUrl.id}`);
    }
  }

  // Use wrapper object so TypeScript can track mutations in callbacks
  const resultHolder: { result: CrawlResult | null } = { result: null };

  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    maxRequestRetries: config.retryAttempts,
    navigationTimeoutSecs: config.timeout / 1000,
    requestHandlerTimeoutSecs: config.timeout / 1000,

    launchContext: {
      launchOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      },
    },

    preNavigationHooks: [
      async ({ page }) => {
        await page.setExtraHTTPHeaders({
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        });
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          if (['image', 'media', 'font'].includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });
      },
    ],

    requestHandler: async ({ page, request }) => {
      const url = request.loadedUrl || request.url;
      const normalizedUrl = normalizeUrl(url);

      await page.waitForLoadState('domcontentloaded');

      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch {
        logger.debug(`Network idle timeout for ${normalizedUrl}, continuing...`);
      }

      await page.waitForTimeout(1500);
      await autoScroll(page);

      // Expand accordions and collapsed content - also captures innerText and innerHTML immediately
      const { count: expandedCount, innerText: innerTextContent, innerHTML: expandedHtmlContent } = await expandAllAccordions(page);
      logger.debug(`Expanded ${expandedCount} accordions, captured ${innerTextContent.length} chars innerText`);

      await page.waitForTimeout(500); // Brief wait for any remaining animations

      const html = await page.content();

      // Try standard extraction first
      let { title, content, htmlContent } = extractContent(html, normalizedUrl);
      logger.debug(`Standard extraction: ${content.length} chars from ${html.length} chars HTML`);

      // Prefer innerText when accordions were expanded, as it captures revealed content
      // that standard HTML extraction often misses (due to display:none in raw HTML)
      // Use innerText if: we expanded accordions AND innerText has substantial content
      if (expandedCount > 0 && innerTextContent.length > 500) {
        logger.debug(`Using innerText (${innerTextContent.length} chars) - ${expandedCount} accordions expanded`);
        content = innerTextContent.replace(/\s+/g, ' ').trim();
        htmlContent = expandedHtmlContent;
      } else if (innerTextContent.length > content.length * 1.2) {
        logger.debug(`Using innerText (${innerTextContent.length} chars) - more content than standard extraction`);
        content = innerTextContent.replace(/\s+/g, ' ').trim();
        htmlContent = expandedHtmlContent;
      }

      if (content.trim().length > 50) {
        resultHolder.result = {
          url: normalizedUrl,
          title: title.substring(0, 500),
          content: content.substring(0, config.maxContentSize),
          htmlContent: htmlContent.substring(0, config.maxContentSize * 2),
          links: [],
        };
        logger.debug(`Successfully crawled: ${normalizedUrl} (${content.length} chars)`);
      } else {
        throw new Error(`No meaningful content found at ${normalizedUrl}`);
      }
    },

    failedRequestHandler: async ({ request, error }) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Crawl failed for ${request.url}: ${errorMessage}`);
      throw new Error(`Failed to crawl ${request.url}: ${errorMessage}`);
    },

    errorHandler: async ({ error, request }) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Error during crawl of ${request.url}: ${errorMessage}`);
    },
  });

  logger.debug(`Starting single URL crawl: ${urlToCrawl}`);
  await crawler.run([urlToCrawl]);

  const crawlResult = resultHolder.result;
  if (crawlResult) {
    await batchSaveUrlsToDatabase(siteId, [crawlResult]);

    const siteUrl = await prisma.siteUrl.findFirst({
      where: { siteId, url: crawlResult.url },
      select: { id: true, htmlContent: true, content: true },
    });

    if (siteUrl) {
      const io = getIO();

      if (io) {
        io.to(`site:${siteId}`).emit('url-status-update', {
          siteId,
          urls: [{ urlId: siteUrl.id, embeddingStatus: UrlEmbeddingStatus.SCRAPED }],
        });
      }

      // Check if site is ready for embeddings
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { crawlStatus: true },
      });

      if (site && (site.crawlStatus === CrawlStatus.READY || site.crawlStatus === CrawlStatus.PARTIAL)) {

        const { generateEmbeddings } = await import('./embeddings');
        const { htmlToText } = await import('../utils/textProcessor');

        try {
          await prisma.siteUrl.update({
            where: { id: siteUrl.id },
            data: { embeddingStatus: UrlEmbeddingStatus.PROCESSING },
          });

          if (io) {
            io.to(`site:${siteId}`).emit('url-status-update', {
              siteId,
              urls: [{ urlId: siteUrl.id, embeddingStatus: UrlEmbeddingStatus.PROCESSING }],
            });
          }

          const textContent = htmlToText(siteUrl.htmlContent || siteUrl.content || '');
          if (textContent.trim()) {
            await generateEmbeddings(siteUrl.id, textContent);
          }

          await prisma.siteUrl.update({
            where: { id: siteUrl.id },
            data: { embeddingStatus: UrlEmbeddingStatus.READY },
          });

          if (io) {
            io.to(`site:${siteId}`).emit('url-status-update', {
              siteId,
              urls: [{ urlId: siteUrl.id, embeddingStatus: UrlEmbeddingStatus.READY }],
            });
          }

          logger.debug(`Generated embeddings for recrawled URL: ${urlToCrawl}`);

          // Update site status if needed
          if (site.crawlStatus === CrawlStatus.PARTIAL || site.crawlStatus === CrawlStatus.READY) {
            const urlCounts = await prisma.siteUrl.groupBy({
              by: ['embeddingStatus'],
              where: { siteId, isExcluded: false },
              _count: true,
            });

            const statusMap = new Map(urlCounts.map(c => [c.embeddingStatus, c._count]));
            const failedCount = statusMap.get(UrlEmbeddingStatus.FAILED) || 0;
            const processingCount = statusMap.get(UrlEmbeddingStatus.PROCESSING) || 0;
            const pendingCount = statusMap.get(UrlEmbeddingStatus.PENDING) || 0;
            const scrapedCount = statusMap.get(UrlEmbeddingStatus.SCRAPED) || 0;

            let newSiteStatus: CrawlStatus | null = null;

            if (failedCount === 0 && processingCount === 0 && pendingCount === 0 && scrapedCount === 0) {
              if (site.crawlStatus !== CrawlStatus.READY) {
                newSiteStatus = CrawlStatus.READY;
              }
            } else if (failedCount > 0 && site.crawlStatus === CrawlStatus.READY) {
              newSiteStatus = CrawlStatus.PARTIAL;
            }

            if (newSiteStatus) {
              await prisma.site.update({
                where: { id: siteId },
                data: { crawlStatus: newSiteStatus },
              });

              if (io) {
                io.to(`site:${siteId}`).emit('crawl-status-update', {
                  siteId,
                  crawlStatus: newSiteStatus,
                });
              }

              logger.debug(`Site ${siteId} status updated to ${newSiteStatus}`);
            }
          }
        } catch (embeddingError) {
          logger.error(`Failed to generate embeddings for URL ${urlToCrawl}:`, embeddingError);

          await prisma.siteUrl.update({
            where: { id: siteUrl.id },
            data: { embeddingStatus: UrlEmbeddingStatus.FAILED },
          });

          if (io) {
            io.to(`site:${siteId}`).emit('url-status-update', {
              siteId,
              urls: [{ urlId: siteUrl.id, embeddingStatus: UrlEmbeddingStatus.FAILED }],
            });
          }
        }
      }
    }
  } else {
    throw new Error(`Failed to crawl URL after ${config.retryAttempts} attempts`);
  }
}

/**
 * Crawl only the selected URLs (selective mode - no discovery)
 * This is faster and more predictable than full crawl
 */
export async function crawlSelectiveUrls(
  siteId: string,
  urlsToCrawl: string[],
  customConfig?: Partial<CrawlerConfig>
): Promise<void> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  // Disable Crawlee's default storage
  Configuration.getGlobalConfig().set('persistStorage', false);

  try {
    const site = await initializeCrawl(siteId);

    const crawlResults: CrawlResult[] = [];
    let crawledCount = 0;  // Successfully crawled
    let failedCount = 0;   // Failed to crawl
    let processedCount = 0; // Total processed (for accurate progress)
    const totalUrls = urlsToCrawl.length;

    logger.info(`Starting selective crawl for site ${site.siteUrl} with ${totalUrls} URLs`);

    // Create the Playwright crawler
    const crawler = new PlaywrightCrawler({
      maxConcurrency: Math.min(config.concurrency, 10), // Allow higher concurrency for selective
      maxRequestRetries: config.retryAttempts,
      navigationTimeoutSecs: config.timeout / 1000,
      requestHandlerTimeoutSecs: config.timeout / 1000,

      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
          ],
        },
      },

      preNavigationHooks: [
        async ({ page }) => {
          await page.setExtraHTTPHeaders({
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          });

          await page.setViewportSize({ width: 1920, height: 1080 });

          await page.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            if (['image', 'media', 'font'].includes(resourceType)) {
              route.abort();
            } else {
              route.continue();
            }
          });
        },
      ],

      requestHandler: async ({ page, request, crawler: crawlerInstance }) => {
        const url = request.loadedUrl || request.url;
        const normalizedUrl = normalizeUrl(url);

        // Check if crawl was paused
        if (await shouldAbortCrawl(siteId)) {
          logger.info(`[Selective] Crawl paused, aborting: ${normalizedUrl}`);
          await crawlerInstance.autoscaledPool?.abort();
          return;
        }

        logger.debug(`[Selective] Crawling: ${normalizedUrl}`);

        try {
          await page.waitForLoadState('domcontentloaded');

          try {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
          } catch {
            logger.debug(`Network idle timeout for ${normalizedUrl}, continuing...`);
          }

          await page.waitForTimeout(1500);
          await autoScroll(page);

          // Emit "expanding content" status before accordion expansion (which can be slow)
          const ioBeforeExpand = getIO();
          if (ioBeforeExpand) {
            ioBeforeExpand.to(`site:${siteId}`).emit('crawl-progress', {
              siteId,
              crawled: processedCount,
              total: totalUrls,
              currentUrl: `Expanding content: ${normalizedUrl.replace(/^https?:\/\//, '').slice(0, 40)}...`,
              phase: 'crawling',
            });
          }

          const { count: expandedCount, innerText: innerTextContent, innerHTML: expandedHtmlContent } = await expandAllAccordions(page);
          if (expandedCount > 0) {
            logger.debug(`Expanded ${expandedCount} accordion elements on ${normalizedUrl}`);
          }

          await page.waitForTimeout(500);

          const html = await page.content();
          let { title, content, htmlContent } = extractContent(html, normalizedUrl);

          if (expandedCount > 0 && innerTextContent.length > 500) {
            content = innerTextContent.replace(/\s+/g, ' ').trim();
            htmlContent = expandedHtmlContent;
          } else if (innerTextContent.length > content.length * 1.2) {
            content = innerTextContent.replace(/\s+/g, ' ').trim();
            htmlContent = expandedHtmlContent;
          }

          if (content.trim().length > 50) {
            const result: CrawlResult = {
              url: normalizedUrl,
              title: title.substring(0, 500),
              content: content.substring(0, config.maxContentSize),
              htmlContent: htmlContent.substring(0, config.maxContentSize * 2),
              links: [],
            };

            crawlResults.push(result);
            crawledCount++;
            processedCount++;

            // Batch save every 10 results
            if (crawlResults.length >= 10) {
              await batchSaveUrlsToDatabase(siteId, crawlResults);
              crawlResults.length = 0;
            }

            logger.debug(`[Selective] Crawled ${normalizedUrl} (${content.length} chars) [${processedCount}/${totalUrls}]`);
          } else {
            logger.warn(`[Selective] No meaningful content found at ${normalizedUrl}`);
            failedCount++;
            processedCount++;
          }

          // Emit progress after each URL is processed (success or failure)
          const io = getIO();
          if (io) {
            const progress = processedCount / totalUrls;
            const elapsedTime = Date.now() - (crawler as { _startTime?: number })._startTime! || 1;
            const avgTimePerPage = elapsedTime / processedCount;
            const remainingPages = totalUrls - processedCount;

            // Use minimum 5 seconds per page for ETA (accounts for accordion-heavy pages)
            const minTimePerPage = 5000; // 5 seconds minimum
            const estimatedTimePerPage = Math.max(avgTimePerPage, minTimePerPage);
            const estimatedRemaining = Math.max(0, Math.round((remainingPages * estimatedTimePerPage) / 1000));

            io.to(`site:${siteId}`).emit('crawl-progress', {
              siteId,
              crawled: processedCount,  // Use processedCount for accurate progress
              total: totalUrls,
              currentUrl: normalizedUrl,
              estimatedSecondsRemaining: estimatedRemaining,
              phase: 'crawling',
              successCount: crawledCount,  // Additional info for transparency
              failedCount: failedCount,
            });
          }
        } catch (error) {
          logger.error(`[Selective] Error processing ${normalizedUrl}:`, error);
          failedCount++;
          processedCount++;

          // Emit progress even for errors
          const io = getIO();
          if (io) {
            const elapsedTime = Date.now() - (crawler as { _startTime?: number })._startTime! || 1;
            const avgTimePerPage = elapsedTime / processedCount;
            const remainingPages = totalUrls - processedCount;
            const minTimePerPage = 5000;
            const estimatedTimePerPage = Math.max(avgTimePerPage, minTimePerPage);
            const estimatedRemaining = Math.max(0, Math.round((remainingPages * estimatedTimePerPage) / 1000));

            io.to(`site:${siteId}`).emit('crawl-progress', {
              siteId,
              crawled: processedCount,
              total: totalUrls,
              currentUrl: normalizedUrl,
              estimatedSecondsRemaining: estimatedRemaining,
              phase: 'crawling',
              successCount: crawledCount,
              failedCount: failedCount,
            });
          }
        }
      },

      failedRequestHandler: async ({ request }) => {
        const normalizedUrl = normalizeUrl(request.url);
        logger.error(`[Selective] Failed to crawl ${request.url} after ${config.retryAttempts} retries`);
        failedCount++;
        processedCount++;

        // Emit progress for failed requests too
        const io = getIO();
        if (io) {
          const elapsedTime = Date.now() - (crawler as { _startTime?: number })._startTime! || 1;
          const avgTimePerPage = elapsedTime / processedCount;
          const remainingPages = totalUrls - processedCount;
          const minTimePerPage = 5000;
          const estimatedTimePerPage = Math.max(avgTimePerPage, minTimePerPage);
          const estimatedRemaining = Math.max(0, Math.round((remainingPages * estimatedTimePerPage) / 1000));

          io.to(`site:${siteId}`).emit('crawl-progress', {
            siteId,
            crawled: processedCount,
            total: totalUrls,
            currentUrl: normalizedUrl,
            estimatedSecondsRemaining: estimatedRemaining,
            phase: 'crawling',
            successCount: crawledCount,
            failedCount: failedCount,
          });
        }
      },
    });

    // Store start time for ETA calculation
    (crawler as { _startTime?: number })._startTime = Date.now();

    // Run the crawler with selected URLs only
    await crawler.run(urlsToCrawl);

    // Save any remaining results
    if (crawlResults.length > 0) {
      await batchSaveUrlsToDatabase(siteId, crawlResults);
    }

    await finalizeCrawl(siteId, site.siteUrl, crawledCount, failedCount);

    logger.info(`[Selective] Completed crawl for site ${site.siteUrl}. Processed ${processedCount}/${totalUrls} pages (${crawledCount} success, ${failedCount} failed).`);
  } catch (error) {
    await handleCrawlError(siteId, error);
    throw error;
  }
}
