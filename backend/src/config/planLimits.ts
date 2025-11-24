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

export interface TrialLimits {
  enabled: boolean;           // Whether trial is enabled
  days: number;               // Trial duration in days
  maxConversations: number;   // Max conversations during trial
  maxMessages: number;        // Max messages during trial
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
 * Get trial limits from system settings
 */
export async function getTrialLimitsFromSettings(): Promise<TrialLimits> {
  try {
    return await settings.getTrialLimits();
  } catch (error) {
    console.warn('Failed to load trial limits from settings, using defaults:', error);
    return {
      enabled: false,
      days: 1,
      maxConversations: 5,
      maxMessages: 20,
    };
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

/**
 * Check if a site's trial has expired
 * Returns { expired: true, reason: string } if trial is over
 */
export async function checkTrialStatus(siteId: string): Promise<{
  isInTrial: boolean;
  trialExpired: boolean;
  reason?: string;
  daysRemaining?: number;
  conversationsRemaining?: number;
  messagesRemaining?: number;
}> {
  const { prisma } = await import('../lib/prisma');
  const trialLimits = await getTrialLimitsFromSettings();

  // If trial is disabled, return not in trial
  if (!trialLimits.enabled) {
    return { isInTrial: false, trialExpired: false };
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      subscription: {
        select: {
          status: true,
          trialEndsAt: true,
        },
      },
      _count: {
        select: {
          conversations: true,
        },
      },
    },
  });

  if (!site) {
    return { isInTrial: false, trialExpired: true, reason: 'Site not found' };
  }

  // If subscription is ACTIVE, not in trial
  if (site.subscription?.status === 'ACTIVE') {
    return { isInTrial: false, trialExpired: false };
  }

  // Check if in trial status
  if (site.subscription?.status !== 'TRIAL') {
    return { isInTrial: false, trialExpired: true, reason: 'No active subscription' };
  }

  // Count conversations and messages
  const conversationCount = site._count.conversations;
  const messageCount = await prisma.message.count({
    where: {
      conversation: {
        siteId,
      },
    },
  });

  // Check time-based expiry
  if (site.subscription.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(site.subscription.trialEndsAt);
    if (now > trialEnd) {
      return {
        isInTrial: true,
        trialExpired: true,
        reason: 'Trial period has ended',
        daysRemaining: 0,
        conversationsRemaining: Math.max(0, trialLimits.maxConversations - conversationCount),
        messagesRemaining: Math.max(0, trialLimits.maxMessages - messageCount),
      };
    }

    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check conversation limit
    if (conversationCount >= trialLimits.maxConversations) {
      return {
        isInTrial: true,
        trialExpired: true,
        reason: `Trial limit reached: ${trialLimits.maxConversations} conversations`,
        daysRemaining,
        conversationsRemaining: 0,
        messagesRemaining: Math.max(0, trialLimits.maxMessages - messageCount),
      };
    }

    // Check message limit
    if (messageCount >= trialLimits.maxMessages) {
      return {
        isInTrial: true,
        trialExpired: true,
        reason: `Trial limit reached: ${trialLimits.maxMessages} messages`,
        daysRemaining,
        conversationsRemaining: Math.max(0, trialLimits.maxConversations - conversationCount),
        messagesRemaining: 0,
      };
    }

    return {
      isInTrial: true,
      trialExpired: false,
      daysRemaining,
      conversationsRemaining: trialLimits.maxConversations - conversationCount,
      messagesRemaining: trialLimits.maxMessages - messageCount,
    };
  }

  // No trial end date set - not in trial
  return { isInTrial: false, trialExpired: true, reason: 'Trial not configured' };
}
