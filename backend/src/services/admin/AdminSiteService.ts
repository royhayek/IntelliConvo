import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import { CrawlStatus } from '@prisma/client';
import { adminExportService, ExportResult } from './AdminExportService';
import { deleteSiteEmbeddings } from '../embeddings';

interface SiteListParams {
  page: number;
  limit: number;
  search?: string;
  userId?: string;
  crawlStatus?: CrawlStatus;
  sortBy?: 'createdAt' | 'siteName' | 'lastCrawledAt';
  sortOrder?: 'asc' | 'desc';
}

interface SiteListResult {
  sites: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UpdateSiteData {
  siteName?: string;
  siteDescription?: string;
  siteIndustry?: string;
  specialInstructions?: string;
  welcomeMessage?: string;
  crawlStatus?: CrawlStatus;
}

class AdminSiteService {
  /**
   * Get paginated list of sites with search and filters
   */
  async getSites(params: SiteListParams): Promise<SiteListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      userId,
      crawlStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { siteName: { contains: search, mode: 'insensitive' } },
        { siteUrl: { contains: search, mode: 'insensitive' } },
      ];
    }

    // User filter
    if (userId) {
      where.userId = userId;
    }

    // Crawl status filter
    if (crawlStatus) {
      where.crawlStatus = crawlStatus;
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              planType: true,
            },
          },
          _count: {
            select: {
              urls: true,
              conversations: true,
              knowledgeFiles: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.site.count({ where }),
    ]);

    return {
      sites: sites.map((site) => ({
        ...site,
        urlsCount: site._count.urls,
        conversationsCount: site._count.conversations,
        filesCount: site._count.knowledgeFiles,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get site by ID with full details
   */
  async getSiteById(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        subscription: true,
        widgetSettings: true,
        conversationStarters: {
          orderBy: { orderIndex: 'asc' },
        },
        activeHosts: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            urls: true,
            conversations: true,
            knowledgeFiles: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Get additional stats
    const [urlStats, conversationStats, fileStats] = await Promise.all([
      prisma.siteUrl.groupBy({
        by: ['isActive', 'isExcluded'],
        where: { siteId },
        _count: { id: true },
      }),
      prisma.conversation.aggregate({
        where: { siteId },
        _sum: { messageCount: true },
        _avg: { messageCount: true },
      }),
      prisma.knowledgeFile.groupBy({
        by: ['status'],
        where: { siteId },
        _count: { id: true },
      }),
    ]);

    return {
      ...site,
      stats: {
        urls: {
          total: site._count.urls,
          breakdown: urlStats,
        },
        conversations: {
          total: site._count.conversations,
          totalMessages: conversationStats._sum.messageCount || 0,
          avgMessages: conversationStats._avg.messageCount || 0,
        },
        files: {
          total: site._count.knowledgeFiles,
          byStatus: fileStats,
        },
      },
    };
  }

  /**
   * Update site
   */
  async updateSite(siteId: string, data: UpdateSiteData) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        ...(data.siteName !== undefined && { siteName: data.siteName }),
        ...(data.siteDescription !== undefined && { siteDescription: data.siteDescription }),
        ...(data.siteIndustry !== undefined && { siteIndustry: data.siteIndustry }),
        ...(data.specialInstructions !== undefined && { specialInstructions: data.specialInstructions }),
        ...(data.welcomeMessage !== undefined && { welcomeMessage: data.welcomeMessage }),
        ...(data.crawlStatus !== undefined && { crawlStatus: data.crawlStatus }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return updatedSite;
  }

  /**
   * Delete site (cascade deletes all related data)
   */
  async deleteSite(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Delete embeddings from Pinecone first (before cascade deletes DB records)
    await deleteSiteEmbeddings(siteId);

    // Delete site (cascades to all related database data due to schema)
    await prisma.site.delete({
      where: { id: siteId },
    });

    return { success: true };
  }

  /**
   * Trigger site recrawl
   */
  async triggerRecrawl(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Update crawl status to pending
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        crawlStatus: 'PENDING',
      },
    });

    // TODO: Add to crawl queue when queue system is integrated
    // For now, just mark as pending

    return {
      success: true,
      site: updatedSite,
      message: 'Site marked for recrawl',
    };
  }

  /**
   * Export sites as CSV or JSON
   */
  async exportSites(format: 'csv' | 'json', filters?: Partial<SiteListParams>): Promise<ExportResult> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { siteName: { contains: filters.search, mode: 'insensitive' } },
        { siteUrl: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.crawlStatus) {
      where.crawlStatus = filters.crawlStatus;
    }

    const sites = await prisma.site.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            urls: true,
            conversations: true,
            knowledgeFiles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = sites.map((site) => ({
      id: site.id,
      siteName: site.siteName,
      siteUrl: site.siteUrl,
      siteDescription: site.siteDescription || '',
      siteIndustry: site.siteIndustry || '',
      crawlStatus: site.crawlStatus,
      ownerEmail: site.user.email,
      ownerName: site.user.fullName || '',
      urlsCount: site._count.urls,
      conversationsCount: site._count.conversations,
      filesCount: site._count.knowledgeFiles,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
      lastCrawledAt: site.lastCrawledAt?.toISOString() || '',
    }));

    return adminExportService.formatForExport(
      exportData,
      format,
      adminExportService.generateFilename('sites')
    );
  }
}

export const adminSiteService = new AdminSiteService();
