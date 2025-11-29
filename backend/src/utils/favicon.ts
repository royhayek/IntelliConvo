/**
 * Favicon Utility
 * Fetches favicon URL for a given website
 */

import * as cheerio from 'cheerio';
import { logger } from './logger';

/**
 * Fetches the favicon URL for a given website URL
 * Tries multiple methods:
 * 1. Parse HTML for link tags (rel="icon", rel="shortcut icon", etc.)
 * 2. Check for /favicon.ico at root
 * 3. Use Google's favicon service as fallback
 *
 * @param siteUrl - The website URL (without protocol)
 * @returns The favicon URL or null if not found
 */
export async function fetchFavicon(siteUrl: string): Promise<string | null> {
  const baseUrl = `https://${siteUrl}`;

  try {
    // Method 1: Fetch the page and look for favicon in HTML
    const faviconFromHtml = await fetchFaviconFromHtml(baseUrl);
    if (faviconFromHtml) {
      return faviconFromHtml;
    }

    // Method 2: Check for /favicon.ico at root
    const faviconIco = `${baseUrl}/favicon.ico`;
    const exists = await checkUrlExists(faviconIco);
    if (exists) {
      return faviconIco;
    }

    // Method 3: Use Google's favicon service as fallback
    // This is a reliable service that caches favicons
    return `https://www.google.com/s2/favicons?domain=${siteUrl}&sz=128`;
  } catch (error) {
    logger.warn(`Failed to fetch favicon for ${siteUrl}:`, error);
    // Return Google's favicon service as ultimate fallback
    return `https://www.google.com/s2/favicons?domain=${siteUrl}&sz=128`;
  }
}

/**
 * Fetches favicon URL from HTML page by parsing link tags
 */
async function fetchFaviconFromHtml(baseUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(baseUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IntelliConvo/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for various favicon link tags (in order of preference)
    // Standard favicons are prioritized over apple-touch-icons
    const selectors = [
      'link[rel="icon"][type="image/svg+xml"]', // SVG favicons (scalable)
      'link[rel="icon"][sizes="192x192"]',
      'link[rel="icon"][sizes="128x128"]',
      'link[rel="icon"][sizes="96x96"]',
      'link[rel="icon"][type="image/png"]',
      'link[rel="icon"]', // Standard favicon
      'link[rel="shortcut icon"]', // Legacy favicon
      'link[rel="apple-touch-icon"]', // iOS-specific (lower priority)
      'link[rel="apple-touch-icon-precomposed"]',
    ];

    for (const selector of selectors) {
      const href = $(selector).attr('href');
      if (href) {
        return resolveUrl(baseUrl, href);
      }
    }

    return null;
  } catch (error) {
    logger.debug(`Could not fetch HTML for favicon from ${baseUrl}:`, error);
    return null;
  }
}

/**
 * Check if a URL exists (returns 200 status)
 */
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Resolve a potentially relative URL to an absolute URL
 */
function resolveUrl(baseUrl: string, href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('//')) {
    return `https:${href}`;
  }
  if (href.startsWith('/')) {
    return `${baseUrl}${href}`;
  }
  return `${baseUrl}/${href}`;
}
