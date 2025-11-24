import * as cheerio from 'cheerio';
import { URL } from 'url';
import { prisma } from '../../lib/prisma';
import { DiscoveryStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getIO } from '../socket';
import { getSitePlanLimits, PlanLimits } from '../../config/planLimits';
import { cacheService, CacheNamespace, CacheTTL } from '../cache';

// Cache TTL for discovery results (24 hours - sitemaps don't change often)
const DISCOVERY_CACHE_TTL = CacheTTL.DAY;

// User agents for requests
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

export interface DiscoveredUrl {
  url: string;
  title?: string;
  source: 'sitemap' | 'discovery' | 'manual';
  category: 'homepage' | 'product' | 'blog' | 'about' | 'support' | 'other';
  priority: 'high' | 'medium' | 'low';
  suggested: boolean;
}

export interface DiscoveryResult {
  urls: DiscoveredUrl[];
  source: 'sitemap' | 'discovery' | 'manual';
  sitemapFound: boolean;
  sitemapUrl?: string;
  estimatedCrawlTime: number; // seconds
  warnings: string[];
  planLimits: {
    maxUrls: number;
    discoveryLimit: number;
    isAtLimit: boolean;
  };
}

interface SitemapEntry {
  url: string;
  title?: string;
  lastmod?: string;
}

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
 * Categorize a URL based on its path
 */
function categorizeUrl(url: string): { category: DiscoveredUrl['category']; priority: DiscoveredUrl['priority'] } {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();

    // Homepage
    if (path === '/' || path === '/home' || path === '/index' || path === '/index.html') {
      return { category: 'homepage', priority: 'high' };
    }

    // About pages
    if (/^\/(about|contact|team|company|careers|jobs|mission|vision|values|story|history|press|media)/i.test(path)) {
      return { category: 'about', priority: 'high' };
    }

    // Product/Service pages
    if (/^\/(product|service|pricing|price|plan|feature|solution|platform|offering|demo|trial)/i.test(path)) {
      return { category: 'product', priority: 'high' };
    }

    // Support pages
    if (/^\/(faq|help|support|doc|documentation|guide|tutorial|knowledge|kb|resource|how-to|getting-started)/i.test(path)) {
      return { category: 'support', priority: 'high' };
    }

    // Blog pages
    if (/^\/(blog|news|article|post|insight|update|announcement)/i.test(path)) {
      return { category: 'blog', priority: 'medium' };
    }

    // Default
    return { category: 'other', priority: 'low' };
  } catch {
    return { category: 'other', priority: 'low' };
  }
}

/**
 * Determine if a URL should be pre-selected based on category and priority
 */
function shouldSuggest(category: DiscoveredUrl['category'], priority: DiscoveredUrl['priority']): boolean {
  // Pre-select high priority and all non-blog pages
  if (priority === 'high') return true;
  if (category === 'homepage' || category === 'about' || category === 'product' || category === 'support') return true;
  return false;
}

/**
 * Fetch and parse sitemap.xml to discover URLs (fast, no content crawling)
 */
async function fetchSitemapUrls(baseUrl: string): Promise<{ entries: SitemapEntry[]; sitemapUrl?: string }> {
  const entries: SitemapEntry[] = [];
  let foundSitemapUrl: string | undefined;

  const sitemapsToCheck = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
    `${baseUrl}/sitemaps/sitemap.xml`,
    `${baseUrl}/sitemap-index.xml`,
    `${baseUrl}/sitemap.xml.gz`,
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
        logger.info(`Found sitemap index with ${sitemapLocs.length} sitemaps`);
        foundSitemapUrl = sitemapUrl;

        // Fetch nested sitemaps in parallel (limit to 50 for speed)
        const nestedPromises = [];
        const maxNestedSitemaps = Math.min(sitemapLocs.length, 50);

        for (let i = 0; i < maxNestedSitemaps; i++) {
          const nestedSitemapUrl = $(sitemapLocs[i]).text().trim();
          nestedPromises.push(
            fetchNestedSitemap(nestedSitemapUrl)
              .catch(() => [] as SitemapEntry[])
          );
        }

        const results = await Promise.all(nestedPromises);
        results.forEach(nestedEntries => entries.push(...nestedEntries));
      } else {
        // Regular sitemap
        foundSitemapUrl = sitemapUrl;
        $('url').each((_, el) => {
          const loc = $(el).find('loc').text().trim();
          const lastmod = $(el).find('lastmod').text().trim();
          if (loc) {
            entries.push({ url: loc, lastmod: lastmod || undefined });
          }
        });
      }

      if (entries.length > 0) {
        logger.info(`Found ${entries.length} URLs from sitemap at ${sitemapUrl}`);
        break;
      }
    } catch (error) {
      logger.debug(`No sitemap found at ${sitemapUrl}`);
    }
  }

  return { entries, sitemapUrl: foundSitemapUrl };
}

/**
 * Fetch a nested sitemap
 */
async function fetchNestedSitemap(sitemapUrl: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': USER_AGENTS[0] },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return entries;

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    $('url').each((_, el) => {
      const loc = $(el).find('loc').text().trim();
      const lastmod = $(el).find('lastmod').text().trim();
      if (loc) {
        entries.push({ url: loc, lastmod: lastmod || undefined });
      }
    });
  } catch {
    // Ignore errors for nested sitemaps
  }

  return entries;
}

/**
 * Discover URLs from homepage links (for sites without sitemaps)
 */
async function discoverUrlsFromHomepage(baseUrl: string, baseDomain: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  const visited = new Set<string>();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': USER_AGENTS[0],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return entries;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract all links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        const normalizedUrl = normalizeUrl(absoluteUrl);

        if (
          !visited.has(normalizedUrl) &&
          isValidUrl(normalizedUrl, baseDomain) &&
          !shouldSkipUrl(normalizedUrl)
        ) {
          visited.add(normalizedUrl);
          const title = $(el).text().trim() || undefined;
          entries.push({ url: normalizedUrl, title });
        }
      } catch {
        // Invalid URL, skip
      }
    });

    // Add the homepage itself
    const homepageUrl = normalizeUrl(baseUrl);
    if (!visited.has(homepageUrl)) {
      const title = $('title').text().trim() || undefined;
      entries.unshift({ url: homepageUrl, title });
    }

    logger.info(`Discovered ${entries.length} URLs from homepage`);
  } catch (error) {
    logger.error('Error discovering URLs from homepage:', error);
  }

  return entries;
}

/**
 * Main discovery function - fast URL enumeration without content crawling
 */
export interface DiscoveryOptions {
  forceRefresh?: boolean; // Bypass cache and re-discover
}

export async function discoverUrls(siteId: string, options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
  const { forceRefresh = false } = options;
  const warnings: string[] = [];
  const cacheKey = siteId;

  try {
    // Get site info
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, siteUrl: true },
    });

    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    // Get plan limits for this site
    const planLimits = await getSitePlanLimits(siteId);
    logger.info(`Plan limits for site ${siteId}: maxUrls=${planLimits.maxUrls}, discoveryLimit=${planLimits.discoveryLimit}`);

    // Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const cachedResult = await cacheService.get<DiscoveryResult>(CacheNamespace.DISCOVERY, cacheKey);
      if (cachedResult) {
        logger.info(`Using cached discovery results for site ${siteId} (${cachedResult.urls.length} URLs)`);

        // Still update site status and emit events for consistency
        await prisma.site.update({
          where: { id: siteId },
          data: { discoveryStatus: DiscoveryStatus.COMPLETED },
        });

        const io = getIO();
        if (io) {
          io.to(`site:${siteId}`).emit('discovery-status-update', {
            siteId,
            status: DiscoveryStatus.COMPLETED,
            urlCount: cachedResult.urls.length,
          });
        }

        // Add note that results were cached
        cachedResult.warnings = [...(cachedResult.warnings || []), 'Results loaded from cache. Use "Refresh" to re-scan.'];
        return cachedResult;
      }
    }

    // Update discovery status to IN_PROGRESS
    await prisma.site.update({
      where: { id: siteId },
      data: { discoveryStatus: DiscoveryStatus.IN_PROGRESS },
    });

    // Emit socket event for progress
    const io = getIO();
    if (io) {
      io.to(`site:${siteId}`).emit('discovery-status-update', {
        siteId,
        status: DiscoveryStatus.IN_PROGRESS,
      });
    }

    const baseUrl = `https://${site.siteUrl}`;

    // Try sitemap first
    const { entries: sitemapEntries, sitemapUrl } = await fetchSitemapUrls(baseUrl);

    let entries: SitemapEntry[];
    let source: DiscoveryResult['source'];
    let sitemapFound = false;

    if (sitemapEntries.length > 0) {
      entries = sitemapEntries;
      source = 'sitemap';
      sitemapFound = true;
      logger.info(`Using ${entries.length} URLs from sitemap for site ${site.siteUrl}`);
    } else {
      // Fall back to homepage discovery
      warnings.push('No sitemap found. Discovered URLs from homepage links.');
      entries = await discoverUrlsFromHomepage(baseUrl, site.siteUrl);
      source = 'discovery';
      logger.info(`Discovered ${entries.length} URLs from homepage for site ${site.siteUrl}`);
    }

    // Filter and deduplicate URLs
    const seen = new Set<string>();
    const filteredEntries = entries.filter(entry => {
      const normalized = normalizeUrl(entry.url);
      if (seen.has(normalized)) return false;
      if (!isValidUrl(normalized, site.siteUrl)) return false;
      if (shouldSkipUrl(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    // Categorize and prioritize URLs
    const discoveredUrls: DiscoveredUrl[] = filteredEntries.map(entry => {
      const { category, priority } = categorizeUrl(entry.url);
      return {
        url: normalizeUrl(entry.url),
        title: entry.title,
        source,
        category,
        priority,
        suggested: shouldSuggest(category, priority),
      };
    });

    // Sort by priority (high first, then medium, then low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    discoveredUrls.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Track total found before limiting
    const totalFound = discoveredUrls.length;
    const isAtDiscoveryLimit = totalFound > planLimits.discoveryLimit;

    // Limit URLs to discovery limit (but show all to user with limit warning)
    const limitedUrls = discoveredUrls.slice(0, planLimits.discoveryLimit);

    // Add warning if at discovery limit
    if (isAtDiscoveryLimit) {
      warnings.push(`Found ${totalFound} URLs. Showing first ${planLimits.discoveryLimit} based on your plan.`);
    }

    // Add warning about max URLs limit
    if (limitedUrls.length > planLimits.maxUrls) {
      warnings.push(`Your plan allows up to ${planLimits.maxUrls} URLs. Select your most important pages.`);
    }

    // Calculate estimated crawl time (roughly 10 seconds per URL with concurrent crawling)
    const estimatedCrawlTime = Math.ceil(Math.min(limitedUrls.length, planLimits.maxUrls) / 5) * 10;

    // Save discovered URLs to database
    await saveDiscoveredUrls(siteId, limitedUrls);

    // Update site discovery status
    await prisma.site.update({
      where: { id: siteId },
      data: {
        discoveryStatus: DiscoveryStatus.COMPLETED,
        discoveredAt: new Date(),
        sitemapUrl: sitemapUrl || null,
        totalDiscoveredUrls: totalFound,
      },
    });

    // Emit completion event
    if (io) {
      io.to(`site:${siteId}`).emit('discovery-status-update', {
        siteId,
        status: DiscoveryStatus.COMPLETED,
        urlCount: limitedUrls.length,
      });
    }

    const result: DiscoveryResult = {
      urls: limitedUrls,
      source,
      sitemapFound,
      sitemapUrl,
      estimatedCrawlTime,
      warnings,
      planLimits: {
        maxUrls: planLimits.maxUrls,
        discoveryLimit: planLimits.discoveryLimit,
        isAtLimit: isAtDiscoveryLimit,
      },
    };

    // Cache the result for future requests
    await cacheService.set(CacheNamespace.DISCOVERY, cacheKey, result, DISCOVERY_CACHE_TTL);
    logger.info(`Cached discovery results for site ${siteId} (${limitedUrls.length} URLs, TTL: ${DISCOVERY_CACHE_TTL}s)`);

    return result;
  } catch (error) {
    logger.error(`Discovery failed for site ${siteId}:`, error);

    // Update status to failed
    await prisma.site.update({
      where: { id: siteId },
      data: { discoveryStatus: DiscoveryStatus.FAILED },
    });

    const io = getIO();
    if (io) {
      io.to(`site:${siteId}`).emit('discovery-status-update', {
        siteId,
        status: DiscoveryStatus.FAILED,
      });
    }

    throw error;
  }
}

/**
 * Invalidate cached discovery results for a site
 * Call this when the site URL changes or user wants to force re-discovery
 */
export async function invalidateDiscoveryCache(siteId: string): Promise<boolean> {
  const deleted = await cacheService.delete(CacheNamespace.DISCOVERY, siteId);
  if (deleted) {
    logger.info(`Invalidated discovery cache for site ${siteId}`);
  }
  return deleted;
}

/**
 * Save discovered URLs to database
 */
async function saveDiscoveredUrls(siteId: string, urls: DiscoveredUrl[]): Promise<void> {
  // Delete existing selections for this site
  await prisma.urlSelection.deleteMany({
    where: { siteId },
  });

  // Create new selections in batches
  const batchSize = 100;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await prisma.urlSelection.createMany({
      data: batch.map(url => ({
        siteId,
        url: url.url,
        title: url.title,
        source: url.source,
        category: url.category,
        priority: url.priority,
        selected: url.suggested,
      })),
    });
  }

  logger.info(`Saved ${urls.length} discovered URLs for site ${siteId}`);
}

/**
 * Get discovery results from database
 */
export async function getDiscoveryResults(siteId: string): Promise<{
  status: DiscoveryStatus;
  urls: DiscoveredUrl[];
  sitemapFound: boolean;
  sitemapUrl?: string;
  totalCount: number;
  selectedCount: number;
  estimatedCrawlTime: number;
  planLimits: {
    maxUrls: number;
    discoveryLimit: number;
    isAtLimit: boolean;
  };
}> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      discoveryStatus: true,
      sitemapUrl: true,
      totalDiscoveredUrls: true,
    },
  });

  if (!site) {
    throw new Error(`Site ${siteId} not found`);
  }

  // Get plan limits
  const planLimits = await getSitePlanLimits(siteId);

  const selections = await prisma.urlSelection.findMany({
    where: { siteId },
    orderBy: [
      { priority: 'asc' },
      { category: 'asc' },
      { url: 'asc' },
    ],
  });

  const urls: DiscoveredUrl[] = selections.map(s => ({
    url: s.url,
    title: s.title || undefined,
    source: s.source as DiscoveredUrl['source'],
    category: s.category as DiscoveredUrl['category'],
    priority: s.priority as DiscoveredUrl['priority'],
    suggested: s.selected,
  }));

  const selectedCount = selections.filter(s => s.selected).length;
  const estimatedCrawlTime = Math.ceil(Math.min(selectedCount, planLimits.maxUrls) / 5) * 10;

  return {
    status: site.discoveryStatus,
    urls,
    sitemapFound: !!site.sitemapUrl,
    sitemapUrl: site.sitemapUrl || undefined,
    totalCount: site.totalDiscoveredUrls,
    selectedCount,
    estimatedCrawlTime,
    planLimits: {
      maxUrls: planLimits.maxUrls,
      discoveryLimit: planLimits.discoveryLimit,
      isAtLimit: selectedCount > planLimits.maxUrls,
    },
  };
}

/**
 * Update URL selections
 */
export async function updateUrlSelections(
  siteId: string,
  selections: { url: string; selected: boolean }[]
): Promise<{ selectedCount: number; estimatedCrawlTime: number }> {
  // Update selections in a transaction
  await prisma.$transaction(
    selections.map(s =>
      prisma.urlSelection.updateMany({
        where: { siteId, url: s.url },
        data: { selected: s.selected },
      })
    )
  );

  // Get updated counts
  const selectedCount = await prisma.urlSelection.count({
    where: { siteId, selected: true },
  });

  const estimatedCrawlTime = Math.ceil(selectedCount / 5) * 10;

  logger.info(`Updated ${selections.length} URL selections for site ${siteId}. Selected: ${selectedCount}`);

  return { selectedCount, estimatedCrawlTime };
}

/**
 * Add manual URLs to selection
 */
export async function addManualUrls(
  siteId: string,
  urls: string[]
): Promise<DiscoveredUrl[]> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { siteUrl: true },
  });

  if (!site) {
    throw new Error(`Site ${siteId} not found`);
  }

  const addedUrls: DiscoveredUrl[] = [];

  for (const rawUrl of urls) {
    try {
      // Normalize and validate URL
      let urlToAdd = rawUrl.trim();
      if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
        urlToAdd = `https://${urlToAdd}`;
      }

      const normalizedUrl = normalizeUrl(urlToAdd);

      // Validate it belongs to the site domain
      if (!isValidUrl(normalizedUrl, site.siteUrl)) {
        logger.warn(`URL ${rawUrl} does not belong to domain ${site.siteUrl}`);
        continue;
      }

      if (shouldSkipUrl(normalizedUrl)) {
        logger.warn(`URL ${rawUrl} is not a valid page URL`);
        continue;
      }

      // Check if already exists
      const existing = await prisma.urlSelection.findUnique({
        where: { siteId_url: { siteId, url: normalizedUrl } },
      });

      if (existing) {
        // Update to selected if not already
        await prisma.urlSelection.update({
          where: { id: existing.id },
          data: { selected: true },
        });
      } else {
        // Create new selection
        const { category, priority } = categorizeUrl(normalizedUrl);
        await prisma.urlSelection.create({
          data: {
            siteId,
            url: normalizedUrl,
            source: 'manual',
            category,
            priority,
            selected: true,
          },
        });

        addedUrls.push({
          url: normalizedUrl,
          source: 'manual',
          category,
          priority,
          suggested: true,
        });
      }

      // Update total count
      await prisma.site.update({
        where: { id: siteId },
        data: {
          totalDiscoveredUrls: { increment: existing ? 0 : 1 },
        },
      });
    } catch (error) {
      logger.warn(`Failed to add URL ${rawUrl}:`, error);
    }
  }

  logger.info(`Added ${addedUrls.length} manual URLs for site ${siteId}`);

  return addedUrls;
}

/**
 * Get selected URLs for crawling
 */
export async function getSelectedUrlsForCrawl(siteId: string): Promise<string[]> {
  const selections = await prisma.urlSelection.findMany({
    where: { siteId, selected: true },
    select: { url: true },
  });

  return selections.map(s => s.url);
}

/**
 * Get discovery statistics by category
 */
export async function getDiscoveryStats(siteId: string): Promise<{
  byCategory: Record<string, { total: number; selected: number }>;
  byPriority: Record<string, { total: number; selected: number }>;
}> {
  const selections = await prisma.urlSelection.findMany({
    where: { siteId },
    select: { category: true, priority: true, selected: true },
  });

  const byCategory: Record<string, { total: number; selected: number }> = {};
  const byPriority: Record<string, { total: number; selected: number }> = {};

  for (const s of selections) {
    if (!byCategory[s.category]) {
      byCategory[s.category] = { total: 0, selected: 0 };
    }
    byCategory[s.category].total++;
    if (s.selected) byCategory[s.category].selected++;

    if (!byPriority[s.priority]) {
      byPriority[s.priority] = { total: 0, selected: 0 };
    }
    byPriority[s.priority].total++;
    if (s.selected) byPriority[s.priority].selected++;
  }

  return { byCategory, byPriority };
}
