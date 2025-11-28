/**
 * Site Service
 * Business logic for site management, conversation starters, and active hosts
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError, AlreadyExistsError, ValidationError } from '../../middleware/errors';
import { AppError, ErrorCode } from '../../middleware/errors';
import { queueCrawl, queueSiteDeletedEmail } from '../../queues';
import { logger } from '../../utils/logger';
import { CrawlStatus, NotificationType } from '@prisma/client';
import { cacheService, CacheNamespace, CacheTTL } from '../cache';
import { deleteSiteEmbeddings } from '../embeddings';
import { fetchFavicon } from '../../utils/favicon';
import { normalizeHostname as normalizeHost } from '../../utils/hostValidation';
import {
  SiteWithMetaDTO,
  SiteListResponse,
  SiteDetailsResponse,
  CreateSiteRequest,
  UpdateSiteRequest,
  StartersResponse,
  UpdateStartersRequest,
  ConversationStarterDTO,
  HostsResponse,
  ActiveHostDTO,
  AddHostRequest,
} from '../../dto/site.dto';
import { deleteSiteFiles } from '../../utils/fileStorage';

/**
 * Helper function to safely convert date to ISO string
 * Handles both Date objects (from Prisma) and strings (from cache)
 */
function toISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * SiteService class
 * Handles all site-related business logic
 */
export class SiteService {
  /**
   * Get all sites for user
   * @param userId - User ID
   * @returns List of sites with metadata
   */
  async getSites(userId: string): Promise<SiteListResponse> {
    const sites = await prisma.site.findMany({
      where: { userId },
      include: {
        urls: {
          where: { isActive: true, isExcluded: false },
          select: { id: true },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            planType: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    // Map to DTOs
    const siteDTOs: SiteWithMetaDTO[] = sites.map((site) => ({
      id: site.id,
      siteUrl: site.siteUrl,
      siteName: site.siteName,
      faviconUrl: site.faviconUrl,
      siteDescription: site.siteDescription,
      siteIndustry: site.siteIndustry,
      specialInstructions: site.specialInstructions,
      startersHeadline: site.startersHeadline,
      crawlStatus: site.crawlStatus,
      lastCrawledAt: site.lastCrawledAt?.toISOString() || null,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
      urlCount: site.urls.length,
      subscription: site.subscription
        ? {
            id: site.subscription.id,
            status: site.subscription.status,
            planType: site.subscription.planType,
            trialEndsAt: site.subscription.trialEndsAt?.toISOString() || null,
            currentPeriodEnd: site.subscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: site.subscription.cancelAtPeriodEnd || false,
          }
        : null,
    }));

    return { data: siteDTOs };
  }

  /**
   * Get site by ID with short-lived caching
   * Uses 60-second TTL to balance performance with data freshness
   * Cache is also invalidated on status changes (webhooks, embedding completion)
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @returns Site details with counts
   */
  async getSiteById(siteId: string, userId: string): Promise<SiteDetailsResponse> {
    const cacheKey = `${siteId}:${userId}`;

    const site = await cacheService.getOrSet(
      CacheNamespace.SITE_CONFIG,
      cacheKey,
      async () => {
        return prisma.site.findFirst({
          where: {
            id: siteId,
            userId,
          },
          include: {
            subscription: true,
            activeHosts: true,
            _count: {
              select: {
                urls: true,
                conversations: true,
                knowledgeFiles: true,
              },
            },
          },
        });
      },
      60 // 60 seconds TTL - short cache for volatile data like crawlStatus
    );

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Map to DTO (use helper for dates that may be strings from cache)
    const siteDTO: SiteWithMetaDTO = {
      id: site.id,
      siteUrl: site.siteUrl,
      siteName: site.siteName,
      faviconUrl: site.faviconUrl,
      siteDescription: site.siteDescription,
      siteIndustry: site.siteIndustry,
      specialInstructions: site.specialInstructions,
      startersHeadline: site.startersHeadline,
      crawlStatus: site.crawlStatus,
      lastCrawledAt: toISOString(site.lastCrawledAt),
      createdAt: toISOString(site.createdAt) || new Date().toISOString(),
      updatedAt: toISOString(site.updatedAt) || new Date().toISOString(),
      urlCount: site._count.urls,
      subscription: site.subscription
        ? {
            id: site.subscription.id,
            status: site.subscription.status,
            planType: site.subscription.planType,
            trialEndsAt: toISOString(site.subscription.trialEndsAt),
            currentPeriodEnd: toISOString(site.subscription.currentPeriodEnd) || new Date().toISOString(),
            cancelAtPeriodEnd: site.subscription.cancelAtPeriodEnd || false,
          }
        : null,
      _count: site._count,
    };

    return { data: siteDTO };
  }

  /**
   * Create a new site
   * @param userId - User ID
   * @param data - Site creation data
   * @returns Created site
   */
  async createSite(
    userId: string,
    data: CreateSiteRequest
  ): Promise<SiteWithMetaDTO> {
    // Normalize URL
    const normalizedUrl = this.normalizeUrl(data.siteUrl);

    // Check if site already exists
    const existingSite = await prisma.site.findFirst({
      where: {
        userId,
        siteUrl: normalizedUrl,
      },
    });

    if (existingSite) {
      throw new AlreadyExistsError('Site', 'URL');
    }

    // Fetch favicon (non-blocking - we'll still create site if this fails)
    let faviconUrl: string | null = null;
    try {
      faviconUrl = await fetchFavicon(normalizedUrl);
    } catch (error) {
      // Silently fail - favicon is not critical
    }

    // Create site
    const site = await prisma.site.create({
      data: {
        userId,
        siteUrl: normalizedUrl,
        siteName: data.siteName || normalizedUrl,
        faviconUrl,
        siteDescription: data.siteDescription,
        siteIndustry: data.siteIndustry,
        crawlStatus: CrawlStatus.PENDING,
      },
    });

    // Create default active host
    await prisma.activeHost.create({
      data: {
        siteId: site.id,
        hostName: normalizedUrl,
        isEnabled: true,
      },
    });

    // NOTE: We no longer auto-queue a full crawl here.
    // The new onboarding flow uses discovery + selective crawl.
    // Users can trigger a crawl manually via the selective crawl endpoint
    // or the triggerCrawl method for recrawling.

    // Map to DTO
    return this.mapSiteToDTO(site);
  }

  /**
   * Update site information
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param data - Update data
   * @returns Updated site
   */
  async updateSite(
    siteId: string,
    userId: string,
    data: UpdateSiteRequest
  ): Promise<SiteWithMetaDTO> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Update site
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data,
    });

    // Invalidate cache
    await this.invalidateCache(siteId, userId);

    return this.mapSiteToDTO(updatedSite);
  }

  /**
   * Delete a site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   */
  async deleteSite(siteId: string, userId: string): Promise<void> {
    // Check ownership and subscription, get user info for email
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
      include: {
        subscription: true,
        user: {
          select: { email: true, fullName: true },
        },
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Prevent deletion of sites with active subscriptions
    if (site.subscription && site.subscription.status === 'ACTIVE') {
      throw new ValidationError('Cannot delete site with active subscription');
    }

    // Store site info for email before deletion
    const siteInfo = {
      siteName: site.siteName,
      siteUrl: site.siteUrl,
      userEmail: site.user.email,
      userName: site.user.fullName || '',
    };

    // Delete embeddings from Pinecone first (before cascade deletes DB records)
    await deleteSiteEmbeddings(siteId);

    // Delete uploaded files (knowledge files, widget logo)
    await deleteSiteFiles(siteId);

    // Clear all site-specific caches before deletion
    await this.clearAllSiteCaches(siteId, userId);

    // Delete site (cascade will handle related database records)
    await prisma.site.delete({
      where: { id: siteId },
    });

    // Send site deleted email confirmation and in-app notification
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      await queueSiteDeletedEmail(userId, siteInfo.userEmail, {
        userName: siteInfo.userName,
        email: siteInfo.userEmail,
        siteName: siteInfo.siteName,
        siteUrl: siteInfo.siteUrl,
        createNewUrl: `${frontendUrl}/onboarding`,
      });

      // Create in-app notification (site is deleted, so no siteId link)
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.INFO,
          title: 'Assistant Deleted',
          message: `Your assistant "${siteInfo.siteName}" has been permanently deleted.`,
          link: '/dashboard',
        },
      });

      logger.info(`Queued site deleted email for user ${userId}, site ${siteInfo.siteName}`);
    } catch (error) {
      logger.error('Failed to queue site deleted email:', error);
    }
  }

  /**
   * Trigger site crawl
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   */
  async triggerCrawl(siteId: string, userId: string): Promise<void> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Check if already crawling
    if (site.crawlStatus === CrawlStatus.CRAWLING) {
      throw new ValidationError('Site is already being crawled');
    }

    // Queue crawl job
    await queueCrawl(siteId, 'full');

    // Invalidate cache
    await this.invalidateCache(siteId, userId);
  }

  /**
   * Get conversation starters for site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @returns Starters with welcome message
   */
  async getStarters(siteId: string, userId: string): Promise<StartersResponse> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
      select: {
        startersHeadline: true,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Get starters
    const starters = await prisma.conversationStarter.findMany({
      where: {
        siteId,
        isActive: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Map to DTOs
    const starterDTOs: ConversationStarterDTO[] = starters.map((starter) => ({
      id: starter.id,
      siteId: starter.siteId,
      starterText: starter.starterText,
      orderIndex: starter.orderIndex,
      isActive: starter.isActive,
      createdAt: starter.createdAt.toISOString(),
      updatedAt: starter.updatedAt.toISOString(),
    }));

    return {
      startersHeadline: site.startersHeadline,
      starters: starterDTOs,
    };
  }

  /**
   * Update conversation starters
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param data - Starters update data
   * @returns Updated starters
   */
  async updateStarters(
    siteId: string,
    userId: string,
    data: UpdateStartersRequest
  ): Promise<StartersResponse> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Update starters headline if provided
    if (data.startersHeadline !== undefined) {
      await prisma.site.update({
        where: { id: siteId },
        data: { startersHeadline: data.startersHeadline ?? undefined },
      });
    }

    // Delete existing starters
    await prisma.conversationStarter.deleteMany({
      where: { siteId },
    });

    // Create new starters
    if (data.starters && data.starters.length > 0) {
      await prisma.conversationStarter.createMany({
        data: data.starters.map((text, index) => ({
          siteId,
          starterText: text,
          orderIndex: index,
          isActive: true,
        })),
      });
    }

    // Invalidate cache
    await this.invalidateCache(siteId, userId);

    // Return updated starters
    return this.getStarters(siteId, userId);
  }

  /**
   * Get active hosts for site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @returns Active hosts
   */
  async getHosts(siteId: string, userId: string): Promise<HostsResponse> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Get hosts
    const hosts = await prisma.activeHost.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    });

    // Map to DTOs
    const hostDTOs: ActiveHostDTO[] = hosts.map((host) => ({
      id: host.id,
      siteId: host.siteId,
      hostName: host.hostName,
      isEnabled: host.isEnabled,
      createdAt: host.createdAt.toISOString(),
      updatedAt: host.updatedAt.toISOString(),
    }));

    return { hosts: hostDTOs };
  }

  /**
   * Add active host
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param data - Host data
   * @returns Created host
   */
  async addHost(
    siteId: string,
    userId: string,
    data: AddHostRequest
  ): Promise<ActiveHostDTO> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Normalize hostname
    const normalizedHost = this.normalizeHostname(data.hostName);

    // Check if host already exists
    const existingHost = await prisma.activeHost.findFirst({
      where: {
        siteId,
        hostName: normalizedHost,
      },
    });

    if (existingHost) {
      throw new AlreadyExistsError('Host', 'hostname');
    }

    // Create host
    const host = await prisma.activeHost.create({
      data: {
        siteId,
        hostName: normalizedHost,
        isEnabled: data.isEnabled ?? true,
      },
    });

    // Invalidate cache
    await this.invalidateCache(siteId, userId);

    // Map to DTO
    return {
      id: host.id,
      siteId: host.siteId,
      hostName: host.hostName,
      isEnabled: host.isEnabled,
      createdAt: host.createdAt.toISOString(),
      updatedAt: host.updatedAt.toISOString(),
    };
  }

  /**
   * Update active host
   * @param siteId - Site ID
   * @param hostId - Host ID
   * @param userId - User ID (for authorization)
   * @param isEnabled - Enable/disable host
   * @returns Updated host
   */
  async updateHost(
    siteId: string,
    hostId: string,
    userId: string,
    isEnabled: boolean
  ): Promise<ActiveHostDTO> {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Verify host exists and belongs to site
    const host = await prisma.activeHost.findFirst({
      where: {
        id: hostId,
        siteId,
      },
    });

    if (!host) {
      throw new NotFoundError('Host', hostId);
    }

    // Update host
    const updatedHost = await prisma.activeHost.update({
      where: { id: hostId },
      data: { isEnabled },
    });

    // Invalidate cache
    await this.invalidateCache(siteId, userId);

    // Map to DTO
    return {
      id: updatedHost.id,
      siteId: updatedHost.siteId,
      hostName: updatedHost.hostName,
      isEnabled: updatedHost.isEnabled,
      createdAt: updatedHost.createdAt.toISOString(),
      updatedAt: updatedHost.updatedAt.toISOString(),
    };
  }

  /**
   * Delete active host
   * @param siteId - Site ID
   * @param hostId - Host ID
   * @param userId - User ID (for authorization)
   */
  async deleteHost(siteId: string, hostId: string, userId: string): Promise<void> {
    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Verify host exists and belongs to site
    const host = await prisma.activeHost.findFirst({
      where: {
        id: hostId,
        siteId,
      },
    });

    if (!host) {
      throw new NotFoundError('Host', hostId);
    }

    // Prevent deletion of last host
    const hostCount = await prisma.activeHost.count({
      where: { siteId },
    });

    if (hostCount <= 1) {
      throw new ValidationError('Cannot delete the last active host');
    }

    // Delete host
    await prisma.activeHost.delete({
      where: { id: hostId },
    });

    // Invalidate cache
    await this.invalidateCache(siteId, userId);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Normalize URL (remove protocol and trailing slash)
   */
  private normalizeUrl(url: string): string {
    let normalized = url.toLowerCase();
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  }

  /**
   * Normalize hostname
   * Now uses shared utility function for consistency
   */
  private normalizeHostname(hostname: string): string {
    return normalizeHost(hostname);
  }

  /**
   * Map site to DTO
   */
  private mapSiteToDTO(site: any): SiteWithMetaDTO {
    return {
      id: site.id,
      siteUrl: site.siteUrl,
      siteName: site.siteName,
      faviconUrl: site.faviconUrl,
      siteDescription: site.siteDescription,
      siteIndustry: site.siteIndustry,
      specialInstructions: site.specialInstructions,
      startersHeadline: site.startersHeadline,
      crawlStatus: site.crawlStatus,
      lastCrawledAt: toISOString(site.lastCrawledAt),
      createdAt: toISOString(site.createdAt) || new Date().toISOString(),
      updatedAt: toISOString(site.updatedAt) || new Date().toISOString(),
      urlCount: 0, // Will be populated when needed
      subscription: null, // Will be populated when needed
    };
  }

  /**
   * Add URLs to an existing site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param urls - Array of URLs to add
   * @param startCrawl - Whether to start crawling immediately
   * @returns Added URL records and job info
   */
  async addUrlsToSite(
    siteId: string,
    userId: string,
    urls: string[],
    startCrawl: boolean = true
  ): Promise<{ addedUrls: any[]; skippedUrls: string[]; jobQueued: boolean }> {
    // Verify ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
      include: {
        urls: { select: { url: true } },
        subscription: true,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Check subscription status
    if (!site.subscription || ['EXPIRED', 'CANCELLED'].includes(site.subscription.status)) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'Active subscription required to add URLs');
    }

    // Get existing URLs to avoid duplicates
    const existingUrls = new Set(site.urls.map(u => u.url.toLowerCase()));

    // Filter out duplicates and normalize URLs
    const newUrls: string[] = [];
    const skippedUrls: string[] = [];

    for (const url of urls) {
      const normalizedUrl = url.toLowerCase().trim();
      if (existingUrls.has(normalizedUrl)) {
        skippedUrls.push(url);
      } else {
        newUrls.push(url);
        existingUrls.add(normalizedUrl); // Prevent duplicates within the batch
      }
    }

    if (newUrls.length === 0) {
      return { addedUrls: [], skippedUrls, jobQueued: false };
    }

    // Create URL records
    const addedUrls = await prisma.$transaction(
      newUrls.map(url =>
        prisma.siteUrl.create({
          data: {
            siteId,
            url,
            isActive: true,
            isExcluded: false,
            embeddingStatus: 'PENDING',
          },
        })
      )
    );

    // Queue crawl if requested and site is ready/partial
    let jobQueued = false;
    if (startCrawl && ['READY', 'PARTIAL'].includes(site.crawlStatus)) {
      const { queueSelectiveCrawl } = await import('../../queues');
      await queueSelectiveCrawl(siteId, newUrls);

      // Update site status to indicate processing
      await prisma.site.update({
        where: { id: siteId },
        data: { crawlStatus: 'CRAWLING' },
      });

      jobQueued = true;
    }

    // Invalidate cache
    await this.invalidateCache(siteId, userId);

    return { addedUrls, skippedUrls, jobQueued };
  }

  /**
   * Invalidate site cache
   */
  private async invalidateCache(siteId: string, userId: string): Promise<void> {
    const cacheKey = `${siteId}:${userId}`;
    await cacheService.delete(CacheNamespace.SITE_CONFIG, cacheKey);
  }

  /**
   * Invalidate site cache by siteId only (for use when userId is not available)
   * Uses pattern matching to clear all cache entries for the site
   */
  async invalidateSiteCacheById(siteId: string): Promise<void> {
    // Use pattern to match all user-specific caches for this site
    await cacheService.deleteByPattern(CacheNamespace.SITE_CONFIG, `${siteId}:*`);
  }

  /**
   * Clear all caches related to a specific site
   * Used before site deletion to clean up all cached data
   */
  private async clearAllSiteCaches(siteId: string, userId: string): Promise<void> {
    // Clear site config cache (pattern: siteId:userId)
    await this.invalidateCache(siteId, userId);

    // Clear widget settings cache
    await cacheService.delete(CacheNamespace.WIDGET_SETTINGS, siteId);

    // Clear conversation starters cache
    await cacheService.delete(CacheNamespace.CONVERSATION_STARTERS, siteId);

    // Clear site stats cache
    await cacheService.delete(CacheNamespace.SITE_STATS, siteId);

    // Clear embedding search cache for this site (pattern: siteId:*)
    await cacheService.deleteByPattern(CacheNamespace.EMBEDDING_SEARCH, `${siteId}:*`);

    // Clear discovery cache for this site
    await cacheService.delete(CacheNamespace.DISCOVERY, siteId);

    // Clear crawl pause flag
    await cacheService.setCrawlPaused(siteId, false);

    logger.info(`Cleared all caches for site ${siteId}`);
  }
}

// Export singleton instance
export const siteService = new SiteService();
