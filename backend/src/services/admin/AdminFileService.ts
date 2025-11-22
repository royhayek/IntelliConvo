import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import { FileStatus } from '@prisma/client';

interface FileListParams {
  page: number;
  limit: number;
  search?: string;
  siteId?: string;
  status?: FileStatus;
  fileType?: string;
  sortBy?: 'uploadedAt' | 'processedAt' | 'fileName' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

interface FileListResult {
  files: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UpdateFileData {
  status?: FileStatus;
  errorMessage?: string;
}

class AdminFileService {
  /**
   * Get paginated list of knowledge files with search and filters
   */
  async getFiles(params: FileListParams): Promise<FileListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      siteId,
      status,
      fileType,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.fileName = { contains: search, mode: 'insensitive' };
    }

    // Site filter
    if (siteId) {
      where.siteId = siteId;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // File type filter
    if (fileType) {
      where.fileType = fileType;
    }

    const [files, total] = await Promise.all([
      prisma.knowledgeFile.findMany({
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
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.knowledgeFile.count({ where }),
    ]);

    return {
      files: files.map((file) => ({
        ...file,
        fileSize: file.fileSize.toString(), // Convert BigInt to string
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
   * Get file by ID with full details
   */
  async getFileById(fileId: string) {
    const file = await prisma.knowledgeFile.findUnique({
      where: { id: fileId },
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
      },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    return {
      ...file,
      fileSize: file.fileSize.toString(), // Convert BigInt to string
    };
  }

  /**
   * Update file status
   */
  async updateFile(fileId: string, data: UpdateFileData) {
    const file = await prisma.knowledgeFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    const updatedFile = await prisma.knowledgeFile.update({
      where: { id: fileId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
        ...(data.status === 'COMPLETED' && { processedAt: new Date() }),
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

    return {
      ...updatedFile,
      fileSize: updatedFile.fileSize.toString(),
    };
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string) {
    const file = await prisma.knowledgeFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    // TODO: Also delete from storage (S3, etc.)
    await prisma.knowledgeFile.delete({
      where: { id: fileId },
    });

    return { success: true };
  }

  /**
   * Mark file for reprocessing
   */
  async reprocessFile(fileId: string) {
    const file = await prisma.knowledgeFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    const updatedFile = await prisma.knowledgeFile.update({
      where: { id: fileId },
      data: {
        status: 'PENDING',
        errorMessage: null,
        processedAt: null,
      },
    });

    // TODO: Add to processing queue

    return {
      success: true,
      file: {
        ...updatedFile,
        fileSize: updatedFile.fileSize.toString(),
      },
      message: 'File marked for reprocessing',
    };
  }

  /**
   * Get distinct file types for filtering
   */
  async getFileTypes() {
    const types = await prisma.knowledgeFile.findMany({
      distinct: ['fileType'],
      select: { fileType: true },
    });

    return types.map((t) => t.fileType);
  }

  /**
   * Get files with stuck processing (pending for too long)
   */
  async getStuckFiles(hoursThreshold: number = 24) {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);

    const files = await prisma.knowledgeFile.findMany({
      where: {
        status: 'PENDING',
        uploadedAt: { lt: threshold },
      },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { uploadedAt: 'asc' },
    });

    return files.map((file) => ({
      ...file,
      fileSize: file.fileSize.toString(),
    }));
  }

  /**
   * Bulk update file status
   */
  async bulkUpdateStatus(fileIds: string[], status: FileStatus) {
    const result = await prisma.knowledgeFile.updateMany({
      where: { id: { in: fileIds } },
      data: {
        status,
        ...(status === 'COMPLETED' && { processedAt: new Date() }),
        ...(status === 'PENDING' && { errorMessage: null, processedAt: null }),
      },
    });

    return {
      success: true,
      updatedCount: result.count,
    };
  }
}

export const adminFileService = new AdminFileService();
