/**
 * URL Service
 * Business logic for site URL management, crawling, and embeddings
 */

import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { UrlEmbeddingStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../middleware/errors';
import { queueCrawl } from '../../queues';
import { generateEmbeddings, deleteEmbeddings } from '../embeddings';
import { htmlToText } from '../../utils/textProcessor';

/**
 * DTO Interfaces
 */
export interface SiteUrlDTO {
  id: string;
  url: string;
  title: string | null;
  isActive: boolean;
  isExcluded: boolean;
  embeddingStatus: string;
  lastCrawledAt: string | null;
}

export interface SiteUrlDetailDTO extends SiteUrlDTO {
  content: string | null;
  htmlContent: string | null;
  embeddingsCount: number;
}

export interface AddUrlsRequest {
  urls: string[];
}

export interface UpdateUrlRequest {
  isActive?: boolean;
  isExcluded?: boolean;
}

export interface UpdateContentRequest {
  content?: string;
  htmlContent?: string;
}

export interface UrlListQuery {
  search?: string;
  status?: 'active' | 'excluded';
}

/**
 * UrlService class
 * Handles all URL-related business logic
 */
export class UrlService {
  /**
   * Get all URLs for a site with optional filtering
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param query - Filter query
   * @returns List of URLs
   */
  async getSiteUrls(
    siteId: string,
    userId: string,
    query: UrlListQuery = {}
  ): Promise<SiteUrlDTO[]> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Build filters
    const filters: any = {
      siteId,
      // Exclude file:// URLs - these are managed in the Knowledge Files section
      NOT: { url: { startsWith: 'file://' } },
    };

    if (query.search) {
      filters.OR = [
        { url: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status === 'active') {
      filters.isActive = true;
      filters.isExcluded = false;
    } else if (query.status === 'excluded') {
      filters.isExcluded = true;
    }

    const urls = await prisma.siteUrl.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        title: true,
        isActive: true,
        isExcluded: true,
        embeddingStatus: true,
        lastCrawledAt: true,
      },
    });

    return urls.map(this.mapUrlToDTO);
  }

  /**
   * Get single URL details
   * @param siteId - Site ID
   * @param urlId - URL ID
   * @param userId - User ID (for authorization)
   * @returns URL details with embeddings count
   */
  async getUrlById(
    siteId: string,
    urlId: string,
    userId: string
  ): Promise<SiteUrlDetailDTO> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Get URL with embeddings count
    const siteUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
      include: {
        _count: {
          select: {
            embeddings: true,
          },
        },
      },
    });

    if (!siteUrl) {
      throw new NotFoundError('URL', urlId);
    }

    return {
      id: siteUrl.id,
      url: siteUrl.url,
      title: siteUrl.title,
      content: siteUrl.content,
      htmlContent: siteUrl.htmlContent,
      isActive: siteUrl.isActive,
      isExcluded: siteUrl.isExcluded,
      embeddingStatus: siteUrl.embeddingStatus || 'SCRAPED',
      lastCrawledAt: siteUrl.lastCrawledAt?.toISOString() || null,
      embeddingsCount: siteUrl._count.embeddings,
    };
  }

  /**
   * Add new URLs to a site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param data - URLs to add
   * @returns Number of URLs created
   */
  async addUrls(
    siteId: string,
    userId: string,
    data: AddUrlsRequest
  ): Promise<{ created: number }> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    const createdUrls = [];

    for (const url of data.urls) {
      // Check if URL already exists
      const existingUrl = await prisma.siteUrl.findFirst({
        where: { siteId, url },
      });

      if (!existingUrl) {
        const newUrl = await prisma.siteUrl.create({
          data: {
            siteId,
            url,
            isActive: true,
            embeddingStatus: UrlEmbeddingStatus.SCRAPING,
          },
        });

        createdUrls.push(newUrl);

        // Queue crawl job for new URL
        await queueCrawl(siteId, 'single', url);
      }
    }

    return { created: createdUrls.length };
  }

  /**
   * Update URL settings
   * @param siteId - Site ID
   * @param urlId - URL ID
   * @param userId - User ID (for authorization)
   * @param data - Update data
   * @returns Updated URL
   */
  async updateUrl(
    siteId: string,
    urlId: string,
    userId: string,
    data: UpdateUrlRequest
  ): Promise<SiteUrlDTO> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Verify URL exists and belongs to site
    const existingUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
    });

    if (!existingUrl) {
      throw new NotFoundError('URL', urlId);
    }

    // Update URL
    const updatedUrl = await prisma.siteUrl.update({
      where: { id: urlId },
      data,
    });

    return this.mapUrlToDTO(updatedUrl);
  }

  /**
   * Update URL content and regenerate embeddings
   * @param siteId - Site ID
   * @param urlId - URL ID
   * @param userId - User ID (for authorization)
   * @param data - Content data
   * @returns Updated URL with embeddings count
   */
  async updateUrlContent(
    siteId: string,
    urlId: string,
    userId: string,
    data: UpdateContentRequest
  ): Promise<SiteUrlDetailDTO> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Verify URL exists and belongs to site
    const existingUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
    });

    if (!existingUrl) {
      throw new NotFoundError('URL', urlId);
    }

    // Process content
    const { htmlContent, plainTextContent } = this.processContent(data);

    // Calculate content hash
    const contentHash = crypto
      .createHash('md5')
      .update(plainTextContent)
      .digest('hex');

    // Update URL
    const updatedUrl = await prisma.siteUrl.update({
      where: { id: urlId },
      data: {
        content: plainTextContent,
        htmlContent: htmlContent,
        contentHash,
      },
    });

    // Delete old embeddings from Pinecone and database, then regenerate
    await deleteEmbeddings(urlId);

    await generateEmbeddings(urlId, plainTextContent);

    // Get updated embedding count
    const embeddingsCount = await prisma.embedding.count({
      where: { siteUrlId: urlId },
    });

    return {
      id: updatedUrl.id,
      url: updatedUrl.url,
      title: updatedUrl.title,
      content: updatedUrl.content,
      htmlContent: updatedUrl.htmlContent,
      isActive: updatedUrl.isActive,
      isExcluded: updatedUrl.isExcluded,
      embeddingStatus: updatedUrl.embeddingStatus || 'READY',
      lastCrawledAt: updatedUrl.lastCrawledAt?.toISOString() || null,
      embeddingsCount,
    };
  }

  /**
   * Trigger crawl for a specific URL
   * @param siteId - Site ID
   * @param urlId - URL ID
   * @param userId - User ID (for authorization)
   */
  async crawlUrl(
    siteId: string,
    urlId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Get URL
    const siteUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
    });

    if (!siteUrl) {
      throw new NotFoundError('URL', urlId);
    }

    // Queue crawl job
    await queueCrawl(siteId, 'single', siteUrl.url);
  }

  /**
   * Delete a URL
   * @param siteId - Site ID
   * @param urlId - URL ID
   * @param userId - User ID (for authorization)
   */
  async deleteUrl(
    siteId: string,
    urlId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Verify URL exists and belongs to site
    const existingUrl = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId },
    });

    if (!existingUrl) {
      throw new NotFoundError('URL', urlId);
    }

    // Delete embeddings from Pinecone and database first
    await deleteEmbeddings(urlId);

    // Delete URL
    await prisma.siteUrl.delete({
      where: { id: urlId },
    });
  }

  // ============================================
  // Retry Methods
  // ============================================

  /**
   * Get failed URLs for a site with error details
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @returns List of failed URLs with error info
   */
  async getFailedUrls(
    siteId: string,
    userId: string
  ): Promise<{
    urls: Array<{
      id: string;
      url: string;
      lastError: string | null;
      retryCount: number;
      lastRetryAt: string | null;
    }>;
    totalFailed: number;
  }> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    const failedUrls = await prisma.siteUrl.findMany({
      where: {
        siteId,
        embeddingStatus: UrlEmbeddingStatus.FAILED,
        isExcluded: false,
      },
      select: {
        id: true,
        url: true,
        lastError: true,
        retryCount: true,
        lastRetryAt: true,
      },
      orderBy: { retryCount: 'asc' }, // Show URLs with fewer retries first
    });

    return {
      urls: failedUrls.map(u => ({
        id: u.id,
        url: u.url,
        lastError: u.lastError,
        retryCount: u.retryCount,
        lastRetryAt: u.lastRetryAt?.toISOString() || null,
      })),
      totalFailed: failedUrls.length,
    };
  }

  /**
   * Retry all failed URLs for a site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Number of URLs queued for retry
   */
  async retryFailedUrls(
    siteId: string,
    userId: string,
    maxRetries: number = 3
  ): Promise<{ retriedCount: number; skippedCount: number }> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Get failed URLs that haven't exceeded max retries
    const failedUrls = await prisma.siteUrl.findMany({
      where: {
        siteId,
        embeddingStatus: UrlEmbeddingStatus.FAILED,
        isExcluded: false,
        retryCount: { lt: maxRetries },
      },
      select: { id: true, url: true, content: true },
    });

    if (failedUrls.length === 0) {
      return { retriedCount: 0, skippedCount: 0 };
    }

    // Count URLs that exceeded max retries
    const skippedCount = await prisma.siteUrl.count({
      where: {
        siteId,
        embeddingStatus: UrlEmbeddingStatus.FAILED,
        isExcluded: false,
        retryCount: { gte: maxRetries },
      },
    });

    // Reset failed URLs to SCRAPED status for re-embedding
    // (URLs with content go to embedding, URLs without go to crawling)
    const urlsWithContent = failedUrls.filter(u => u.content);
    const urlsWithoutContent = failedUrls.filter(u => !u.content);

    // Reset URLs with content to SCRAPED for re-embedding
    if (urlsWithContent.length > 0) {
      await prisma.siteUrl.updateMany({
        where: { id: { in: urlsWithContent.map(u => u.id) } },
        data: { embeddingStatus: UrlEmbeddingStatus.SCRAPED },
      });

      // Queue embedding job
      const { queueEmbeddingGeneration } = await import('../../queues');
      await queueEmbeddingGeneration(siteId, userId);
    }

    // Queue crawl for URLs without content
    if (urlsWithoutContent.length > 0) {
      const { queueSelectiveCrawl } = await import('../../queues');
      await queueSelectiveCrawl(siteId, urlsWithoutContent.map(u => u.url));
    }

    return { retriedCount: failedUrls.length, skippedCount };
  }

  /**
   * Retry a single failed URL
   * @param siteId - Site ID
   * @param urlId - URL ID
   * @param userId - User ID (for authorization)
   */
  async retryUrl(
    siteId: string,
    urlId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    const url = await prisma.siteUrl.findFirst({
      where: { id: urlId, siteId, embeddingStatus: UrlEmbeddingStatus.FAILED },
    });

    if (!url) {
      throw new NotFoundError('Failed URL', urlId);
    }

    if (url.content) {
      // Has content, just re-embed
      await prisma.siteUrl.update({
        where: { id: urlId },
        data: { embeddingStatus: UrlEmbeddingStatus.SCRAPED },
      });

      // Queue embedding job
      const { queueEmbeddingGeneration } = await import('../../queues');
      await queueEmbeddingGeneration(siteId, userId);
    } else {
      // No content, needs recrawl
      await queueCrawl(siteId, 'single', url.url);
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Verify user owns the site
   */
  private async verifySiteOwnership(
    siteId: string,
    userId: string
  ): Promise<void> {
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }
  }

  /**
   * Process content (HTML or plain text)
   */
  private processContent(data: UpdateContentRequest): {
    htmlContent: string;
    plainTextContent: string;
  } {
    if (!data.content && !data.htmlContent) {
      throw new ValidationError('Either content or htmlContent must be provided');
    }

    let htmlContent: string;
    let plainTextContent: string;

    if (data.htmlContent) {
      // HTML content provided
      htmlContent = data.htmlContent;
      plainTextContent = htmlToText(htmlContent);
    } else if (data.content) {
      // Check if content contains HTML tags
      const hasHtmlTags = /<[^>]+>/g.test(data.content);

      if (hasHtmlTags) {
        htmlContent = data.content;
        plainTextContent = htmlToText(htmlContent);
      } else {
        // Plain text
        plainTextContent = data.content;
        htmlContent = data.content;
      }
    } else {
      throw new ValidationError('Either content or htmlContent must be provided');
    }

    return { htmlContent, plainTextContent };
  }

  /**
   * Map URL entity to DTO
   */
  private mapUrlToDTO(url: any): SiteUrlDTO {
    return {
      id: url.id,
      url: url.url,
      title: url.title,
      isActive: url.isActive,
      isExcluded: url.isExcluded,
      embeddingStatus: url.embeddingStatus || 'SCRAPED',
      lastCrawledAt: url.lastCrawledAt?.toISOString() || null,
    };
  }
}

// Export singleton instance
export const urlService = new UrlService();
