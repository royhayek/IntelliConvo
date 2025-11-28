import crypto from 'crypto';
import pdf from 'pdf-parse';
import { prisma } from '../lib/prisma';
import { generateEmbeddings } from './embeddings';
import { logger } from '../utils/logger';
import { settings } from '../lib/settings';
import { saveFile as saveFileToStorage, deleteFile, FileType } from '../utils/fileStorage';
import {
  AppError,
  ValidationError,
  NotFoundError,
  InternalError,
  ErrorCode,
} from '../middleware/errors';

interface ProcessedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: bigint;
  content: string;
  chunks: number;
}

export async function processUploadedFile(
  siteId: string,
  file: Express.Multer.File
): Promise<ProcessedFile> {
  try {
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('File type not supported. Only PDF and TXT files are allowed.');
    }

    // Validate file size using settings
    const maxSizeMB = await settings.getMaxFileSizeMB();
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError(`File size too large. Maximum size is ${maxSizeMB}MB.`);
    }

    // Extract text content based on file type
    let textContent: string;

    if (file.mimetype === 'application/pdf') {
      textContent = await extractPDFText(file.buffer);
    } else if (file.mimetype === 'text/plain') {
      textContent = file.buffer.toString('utf-8');
    } else {
      throw new ValidationError('Unsupported file type');
    }

    // Validate content length
    if (textContent.length < 10) {
      throw new ValidationError('File content is too short or could not be extracted.');
    }

    // Save file using organized storage
    const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
    const storagePath = await saveFileToStorage({
      fileType: FileType.KNOWLEDGE,
      siteId,
      buffer: file.buffer,
      originalName: file.originalname,
      fileHash,
    });

    // Save file record to database
    const knowledgeFile = await prisma.knowledgeFile.create({
      data: {
        siteId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: BigInt(file.size),
        fileUrl: storagePath,
        processed: false,
        status: 'PENDING',
      },
    });

    // Generate embeddings for the content
    // Create a temporary URL entry to leverage existing embedding system
    const tempUrl = await prisma.siteUrl.create({
      data: {
        siteId,
        url: `file://${knowledgeFile.id}`,
        title: `File: ${file.originalname}`,
        content: textContent,
        contentHash: fileHash,
        lastCrawledAt: new Date(),
        isActive: true,
        isExcluded: false,
        embeddingStatus: 'PROCESSING', // Set initial status for embedding generation
      },
    });

    try {
      // Generate embeddings
      await generateEmbeddings(tempUrl.id, textContent);

      // Get chunk count
      const embeddings = await prisma.embedding.findMany({
        where: { siteUrlId: tempUrl.id },
      });

      // Update SiteUrl embedding status to READY
      await prisma.siteUrl.update({
        where: { id: tempUrl.id },
        data: { embeddingStatus: 'READY' },
      });

      // Update file as completed
      await prisma.knowledgeFile.update({
        where: { id: knowledgeFile.id },
        data: {
          processed: true,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      logger.info(`Successfully processed file ${file.originalname} with ${embeddings.length} chunks`);

      return {
        id: knowledgeFile.id,
        fileName: knowledgeFile.fileName,
        fileType: knowledgeFile.fileType,
        fileSize: knowledgeFile.fileSize,
        content: textContent.substring(0, 1000), // Return first 1000 chars as preview
        chunks: embeddings.length,
      };
    } catch (embeddingError) {
      // Update SiteUrl embedding status to FAILED
      await prisma.siteUrl.update({
        where: { id: tempUrl.id },
        data: { embeddingStatus: 'FAILED' },
      });

      // Update file as failed
      const errorMsg = embeddingError instanceof Error ? embeddingError.message : 'Unknown error during embedding generation';
      await prisma.knowledgeFile.update({
        where: { id: knowledgeFile.id },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      });

      logger.error(`File processing failed for ${file.originalname}:`, embeddingError);
      throw new InternalError(`Failed to process file: ${errorMsg}`);
    }
  } catch (error) {
    logger.error('File processing failed:', error);
    throw error;
  }
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new ValidationError('PDF contains no extractable text content.');
    }

    // Clean up the text
    const cleanText = data.text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters
      .trim();

    if (cleanText.length < 10) {
      throw new ValidationError('PDF text content is too short after processing.');
    }

    return cleanText;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('PDF extraction failed:', error);
    throw new InternalError('Failed to extract text from PDF. The file may be corrupted or password-protected.');
  }
}


export async function deleteKnowledgeFile(fileId: string, siteId: string): Promise<void> {
  try {
    // Get file record
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, siteId },
    });

    if (!file) {
      throw new NotFoundError('File');
    }

    // Find associated URL record
    const tempUrl = await prisma.siteUrl.findFirst({
      where: {
        siteId,
        url: `file://${fileId}`,
      },
      include: {
        embeddings: true,
      },
    });

    if (tempUrl) {
      // Delete embeddings from vector database
      for (const embedding of tempUrl.embeddings) {
        // This will be handled by the embeddings service
      }

      // Delete URL record (will cascade delete embeddings)
      await prisma.siteUrl.delete({
        where: { id: tempUrl.id },
      });
    }

    // Delete file from storage using utility
    if (file.fileUrl) {
      await deleteFile(file.fileUrl);
    }

    // Delete file record
    await prisma.knowledgeFile.delete({
      where: { id: fileId },
    });

    logger.info(`Successfully deleted file ${file.fileName} (${fileId})`);
  } catch (error) {
    logger.error('File deletion failed:', error);
    throw error;
  }
}

export async function getFileContent(fileId: string, siteId: string): Promise<string> {
  try {
    // Find the associated URL record
    const tempUrl = await prisma.siteUrl.findFirst({
      where: {
        siteId,
        url: `file://${fileId}`,
      },
    });

    if (!tempUrl || !tempUrl.content) {
      throw new NotFoundError('File content');
    }

    return tempUrl.content;
  } catch (error) {
    logger.error('Failed to get file content:', error);
    throw error;
  }
}