import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import { deleteEmbeddingsByVectorIds, deleteSiteEmbeddings, deleteAllPineconeVectors } from '../embeddings';

interface EmbeddingListParams {
  page: number;
  limit: number;
  siteUrlId?: string;
  siteId?: string;
  sortBy?: 'createdAt' | 'chunkIndex';
  sortOrder?: 'asc' | 'desc';
}

interface EmbeddingListResult {
  embeddings: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminEmbeddingService {
  /**
   * Get paginated list of embeddings with filters
   */
  async getEmbeddings(params: EmbeddingListParams): Promise<EmbeddingListResult> {
    const {
      page = 1,
      limit = 20,
      siteUrlId,
      siteId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Site URL filter
    if (siteUrlId) {
      where.siteUrlId = siteUrlId;
    }

    // Site filter (via siteUrl)
    if (siteId) {
      where.siteUrl = {
        siteId,
      };
    }

    const [embeddings, total] = await Promise.all([
      prisma.embedding.findMany({
        where,
        include: {
          siteUrl: {
            select: {
              id: true,
              url: true,
              title: true,
              site: {
                select: {
                  id: true,
                  siteName: true,
                  user: {
                    select: {
                      id: true,
                      email: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.embedding.count({ where }),
    ]);

    return {
      embeddings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get embedding by ID with full details
   */
  async getEmbeddingById(embeddingId: string) {
    const embedding = await prisma.embedding.findUnique({
      where: { id: embeddingId },
      include: {
        siteUrl: {
          select: {
            id: true,
            url: true,
            title: true,
            content: true,
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
          },
        },
      },
    });

    if (!embedding) {
      throw new NotFoundError('Embedding', embeddingId);
    }

    return embedding;
  }

  /**
   * Delete embedding
   */
  async deleteEmbedding(embeddingId: string) {
    const embedding = await prisma.embedding.findUnique({
      where: { id: embeddingId },
    });

    if (!embedding) {
      throw new NotFoundError('Embedding', embeddingId);
    }

    // Delete from Pinecone first
    await deleteEmbeddingsByVectorIds([embedding.vectorId]);

    // Delete from database
    await prisma.embedding.delete({
      where: { id: embeddingId },
    });

    return { success: true };
  }

  /**
   * Bulk delete embeddings
   */
  async bulkDeleteEmbeddings(embeddingIds: string[]) {
    // Get vector IDs for Pinecone deletion
    const embeddings = await prisma.embedding.findMany({
      where: { id: { in: embeddingIds } },
      select: { vectorId: true },
    });

    // Delete from Pinecone first
    const vectorIds = embeddings.map(e => e.vectorId);
    await deleteEmbeddingsByVectorIds(vectorIds);

    // Delete from database
    const result = await prisma.embedding.deleteMany({
      where: { id: { in: embeddingIds } },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  }

  /**
   * Delete all embeddings for a site
   */
  async deleteAllSiteEmbeddings(siteId: string) {
    // Get all URLs for the site first
    const urls = await prisma.siteUrl.findMany({
      where: { siteId },
      select: { id: true },
    });

    const urlIds = urls.map((u) => u.id);

    // Delete from Pinecone first
    const deletedCount = await deleteSiteEmbeddings(siteId);

    // Delete from database
    await prisma.embedding.deleteMany({
      where: { siteUrlId: { in: urlIds } },
    });

    return {
      success: true,
      deletedCount,
    };
  }

  /**
   * Get embedding statistics for a site
   */
  async getSiteEmbeddingStats(siteId: string) {
    const stats = await prisma.embedding.aggregate({
      where: {
        siteUrl: {
          siteId,
        },
      },
      _count: { id: true },
    });

    const urlsWithEmbeddings = await prisma.siteUrl.count({
      where: {
        siteId,
        embeddings: { some: {} },
      },
    });

    const urlsWithoutEmbeddings = await prisma.siteUrl.count({
      where: {
        siteId,
        embeddings: { none: {} },
      },
    });

    return {
      totalEmbeddings: stats._count.id,
      urlsWithEmbeddings,
      urlsWithoutEmbeddings,
    };
  }

  /**
   * Delete ALL vectors from Pinecone index - DANGER ZONE
   * This wipes the entire Pinecone index and clears all embedding records from the database
   */
  async deleteAllPineconeData() {
    return await deleteAllPineconeVectors();
  }
}

export const adminEmbeddingService = new AdminEmbeddingService();
