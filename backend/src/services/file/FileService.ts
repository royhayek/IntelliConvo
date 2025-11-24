/**
 * File Service
 * Business logic for knowledge file management and processing
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError, AppError, ErrorCode } from '../../middleware/errors';
import { processUploadedFile, deleteKnowledgeFile, getFileContent } from '../fileProcessor';
import { generateEmbeddings } from '../embeddings';

/**
 * DTO Interfaces
 */
export interface KnowledgeFileDTO {
  id: string;
  fileName: string;
  originalName: string; // Alias for fileName for frontend compatibility
  fileType: string;
  fileSize: string;
  processed: boolean;
  embeddingStatus: string; // Maps from status field
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
}

export interface KnowledgeFileDetailDTO extends KnowledgeFileDTO {
  content: string;
  chunks: number;
}

export interface FileListQuery {
  search?: string;
  processed?: boolean;
  status?: string;
}

export interface FileUploadResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  chunks: number;
  preview: string;
}

/**
 * FileService class
 * Handles all file-related business logic
 */
export class FileService {
  /**
   * Get all files for a site
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param query - Filter query
   * @returns List of files with total count
   */
  async getSiteFiles(
    siteId: string,
    userId: string,
    query: FileListQuery = {}
  ): Promise<{ files: KnowledgeFileDTO[]; total: number }> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Build filters
    const filters: any = { siteId };

    if (query.search) {
      filters.fileName = { contains: query.search, mode: 'insensitive' };
    }

    if (query.processed !== undefined) {
      filters.processed = query.processed;
    }

    if (query.status) {
      filters.status = query.status;
    }

    // Get files
    const files = await prisma.knowledgeFile.findMany({
      where: filters,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        processed: true,
        status: true,
        errorMessage: true,
        uploadedAt: true,
        processedAt: true,
      },
    });

    const total = await prisma.knowledgeFile.count({ where: filters });

    return {
      files: files.map(this.mapFileToDTO),
      total,
    };
  }

  /**
   * Get file details with content
   * @param siteId - Site ID
   * @param fileId - File ID
   * @param userId - User ID (for authorization)
   * @returns File details with content
   */
  async getFileById(
    siteId: string,
    fileId: string,
    userId: string
  ): Promise<KnowledgeFileDetailDTO> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Get file
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, siteId },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    // Get file content and chunks count
    let content = '';
    let chunks = 0;

    try {
      content = await getFileContent(fileId, siteId);

      // Count embeddings for this file
      const tempUrl = await prisma.siteUrl.findFirst({
        where: {
          siteId,
          url: `file://${fileId}`,
        },
        include: {
          _count: {
            select: { embeddings: true },
          },
        },
      });

      chunks = tempUrl?._count.embeddings || 0;
    } catch (error) {
      // Content might not be available if processing failed
    }

    return {
      ...this.mapFileToDTO(file),
      content,
      chunks,
    };
  }

  /**
   * Upload and process a file
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param file - Multer file object
   * @returns Upload result
   */
  async uploadFile(
    siteId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Check file count limit
    const fileCount = await prisma.knowledgeFile.count({
      where: { siteId },
    });

    const MAX_FILES_PER_SITE = 50;
    if (fileCount >= MAX_FILES_PER_SITE) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        `Maximum number of files (${MAX_FILES_PER_SITE}) reached for this site`
      );
    }

    // Process the uploaded file
    const result = await processUploadedFile(siteId, file);

    return {
      id: result.id,
      fileName: result.fileName,
      fileType: result.fileType,
      fileSize: result.fileSize.toString(),
      chunks: result.chunks,
      preview: result.content,
    };
  }

  /**
   * Delete a file
   * @param siteId - Site ID
   * @param fileId - File ID
   * @param userId - User ID (for authorization)
   */
  async deleteFile(
    siteId: string,
    fileId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Verify file exists and belongs to site
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, siteId },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    // Delete file (handles file system and database)
    await deleteKnowledgeFile(fileId, siteId);
  }

  /**
   * Reprocess a file
   * @param siteId - Site ID
   * @param fileId - File ID
   * @param userId - User ID (for authorization)
   */
  async reprocessFile(
    siteId: string,
    fileId: string,
    userId: string
  ): Promise<void> {
    // Verify user owns the site
    await this.verifySiteOwnership(siteId, userId);

    // Get file
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, siteId },
    });

    if (!file) {
      throw new NotFoundError('File', fileId);
    }

    // Find associated URL and content
    const tempUrl = await prisma.siteUrl.findFirst({
      where: {
        siteId,
        url: `file://${fileId}`,
      },
    });

    if (!tempUrl || !tempUrl.content) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        'File content not available for reprocessing'
      );
    }

    // Delete existing embeddings
    await prisma.embedding.deleteMany({
      where: { siteUrlId: tempUrl.id },
    });

    // Reset status to PENDING/PROCESSING
    await prisma.knowledgeFile.update({
      where: { id: fileId },
      data: {
        status: 'PENDING',
        errorMessage: null,
      },
    });

    // Update SiteUrl status to PROCESSING
    await prisma.siteUrl.update({
      where: { id: tempUrl.id },
      data: { embeddingStatus: 'PROCESSING' },
    });

    try {
      // Regenerate embeddings
      await generateEmbeddings(tempUrl.id, tempUrl.content);

      // Update SiteUrl status to READY
      await prisma.siteUrl.update({
        where: { id: tempUrl.id },
        data: { embeddingStatus: 'READY' },
      });

      // Update file as completed
      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: {
          processed: true,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });
    } catch (reprocessError) {
      // Update SiteUrl status to FAILED
      await prisma.siteUrl.update({
        where: { id: tempUrl.id },
        data: { embeddingStatus: 'FAILED' },
      });

      // Update file as failed
      const errorMsg =
        reprocessError instanceof Error
          ? reprocessError.message
          : 'Unknown error during reprocessing';
      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      });

      throw new AppError(
        500,
        ErrorCode.INTERNAL_ERROR,
        `Failed to reprocess file: ${errorMsg}`
      );
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
   * Map file entity to DTO
   */
  private mapFileToDTO(file: any): KnowledgeFileDTO {
    return {
      id: file.id,
      fileName: file.fileName,
      originalName: file.fileName, // Alias for frontend compatibility
      fileType: file.fileType,
      fileSize: file.fileSize.toString(), // Convert BigInt to string
      processed: file.processed,
      embeddingStatus: file.status, // Map status to embeddingStatus for frontend
      errorMessage: file.errorMessage || null,
      uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : file.uploadedAt,
      processedAt: file.processedAt instanceof Date ? file.processedAt.toISOString() : file.processedAt || null,
    };
  }
}

// Export singleton instance
export const fileService = new FileService();
