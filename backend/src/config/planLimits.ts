/**
 * Plan-based URL limits for crawling and discovery
 *
 * These limits are enforced during URL selection and crawling phases
 * to ensure fair resource usage across subscription tiers.
 *
 * Limits are configurable via system settings (admin panel).
 */

import { settings } from '../lib/settings';

export interface PlanLimits {
  maxUrls: number;              // Maximum URLs that can be crawled
  maxCrawlTimeMinutes: number;  // Maximum crawl time allowed
  discoveryLimit: number;       // Maximum URLs shown during discovery
  concurrency: number;          // Crawler concurrency for this tier
}

// Default limits (fallback if settings fail to load)
const DEFAULT_LIMITS: PlanLimits = {
  maxUrls: 500,
  maxCrawlTimeMinutes: 45,
  discoveryLimit: 2000,
  concurrency: 10,
};

/**
 * Get plan limits from system settings
 * All users (trial and paid) get the same URL limits since payment is required for embeddings
 */
export async function getPlanLimitsFromSettings(): Promise<PlanLimits> {
  try {
    const maxUrls = await settings.getMaxUrlsPerSite();
    return {
      maxUrls,
      maxCrawlTimeMinutes: Math.ceil(maxUrls / 10), // ~10 URLs per minute
      discoveryLimit: maxUrls * 4, // Show 4x the limit for selection
      concurrency: 10,
    };
  } catch (error) {
    console.warn('Failed to load plan limits from settings, using defaults:', error);
    return DEFAULT_LIMITS;
  }
}

/**
 * Get plan limits for a site
 * Since payment is required for embeddings, all users get the same crawl limits
 */
export async function getSitePlanLimits(siteId: string): Promise<PlanLimits> {
  // All sites get the same limits - payment gate is on embeddings, not crawling
  return getPlanLimitsFromSettings();
}
