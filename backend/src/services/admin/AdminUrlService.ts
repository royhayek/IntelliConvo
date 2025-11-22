import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import { deleteEmbeddings } from '../embeddings';

interface UrlListParams {
  page: number;
  limit: number;
  search?: string;
  siteId?: string;
  isActive?: boolean;
  isExcluded?: boolean;
  hasEmbeddings?: boolean;
  sortBy?: 'createdAt' | 'lastCrawledAt' | 'url';
  sortOrder?: 'asc' | 'desc';
}

interface UrlListResult {
  urls: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UpdateUrlData {
  isActive?: boolean;
  isExcluded?: boolean;
  title?: string;
}

class AdminUrlService {
  /**
   * Get paginated list of URLs with search and filters
   */
  async getUrls(params: UrlListParams): Promise<UrlListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      siteId,
      isActive,
      isExcluded,
      hasEmbeddings,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Site filter
    if (siteId) {
      where.siteId = siteId;
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Excluded filter
    if (isExcluded !== undefined) {
      where.isExcluded = isExcluded;
    }

    // Has embeddings filter
    if (hasEmbeddings !== undefined) {
      if (hasEmbeddings) {
        where.embeddings = { some: {} };
      } else {
        where.embeddings = { none: {} };
      }
    }

    const [urls, total] = await Promise.all([
      prisma.siteUrl.findMany({
        where,
        include: {
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
          _count: {
            select: {
              embeddings: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.siteUrl.count({ where }),
    ]);

    return {
      urls: urls.map((url) => ({
        ...url,
        embeddingsCount: url._count.embeddings,
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
   * Get URL by ID with full details
   */
  async getUrlById(urlId: string) {
    const url = await prisma.siteUrl.findUnique({
      where: { id: urlId },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        embeddings: {
          select: {
            id: true,
            chunkIndex: true,
            vectorId: true,
            createdAt: true,
          },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!url) {
      throw new NotFoundError('URL', urlId);
    }

    return {
      ...url,
      embeddingsCount: url.embeddings.length,
    };
  }

  /**
   * Update URL
   */
  async updateUrl(urlId: string, data: UpdateUrlData) {
    const url = await prisma.siteUrl.findUnique({
      where: { id: urlId },
    });

    if (!url) {
      throw new NotFoundError('URL', urlId);
    }

    const updatedUrl = await prisma.siteUrl.update({
      where: { id: urlId },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isExcluded !== undefined && { isExcluded: data.isExcluded }),
        ...(data.title !== undefined && { title: data.title }),
      },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
          },
        },
      },
    });

    return updatedUrl;
  }

  /**
   * Delete URL and its embeddings
   */
  async deleteUrl(urlId: string) {
    const url = await prisma.siteUrl.findUnique({
      where: { id: urlId },
    });

    if (!url) {
      throw new NotFoundError('URL', urlId);
    }

    // Delete embeddings from Pinecone and database first
    await deleteEmbeddings(urlId);

    // Delete URL
    await prisma.siteUrl.delete({
      where: { id: urlId },
    });

    return { success: true };
  }

  /**
   * Bulk update URLs status
   */
  async bulkUpdateUrls(urlIds: string[], data: { isActive?: boolean; isExcluded?: boolean }) {
    const result = await prisma.siteUrl.updateMany({
      where: { id: { in: urlIds } },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isExcluded !== undefined && { isExcluded: data.isExcluded }),
      },
    });

    return {
      success: true,
      updatedCount: result.count,
    };
  }

  /**
   * Delete embeddings for a URL (to allow re-embedding)
   */
  async deleteUrlEmbeddings(urlId: string) {
    const url = await prisma.siteUrl.findUnique({
      where: { id: urlId },
    });

    if (!url) {
      throw new NotFoundError('URL', urlId);
    }

    // Get count before deletion
    const count = await prisma.embedding.count({
      where: { siteUrlId: urlId },
    });

    // Delete from Pinecone and database
    await deleteEmbeddings(urlId);

    return {
      success: true,
      deletedCount: count,
    };
  }
}

export const adminUrlService = new AdminUrlService();
