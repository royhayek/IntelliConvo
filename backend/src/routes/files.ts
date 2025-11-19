import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { processUploadedFile, deleteKnowledgeFile, getFileContent } from '../services/fileProcessor';
import { queueCrawl } from '../queues';

const router = Router({ mergeParams: true });

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF and TXT files
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'File type not supported. Only PDF and TXT files are allowed.'));
    }
  },
});

/**
 * @swagger
 * /api/sites/{siteId}/files:
 *   get:
 *     summary: Get all knowledge files for a site
 *     description: Retrieve all uploaded knowledge files for the specified site
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search files by name
 *       - in: query
 *         name: processed
 *         schema:
 *           type: boolean
 *         description: Filter by processed status
 *     responses:
 *       200:
 *         description: List of knowledge files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       originalName:
 *                         type: string
 *                         description: Original uploaded filename
 *                       fileType:
 *                         type: string
 *                       fileSize:
 *                         type: string
 *                       processed:
 *                         type: boolean
 *                       embeddingStatus:
 *                         type: string
 *                         enum: [pending, processing, completed, failed]
 *                         description: Status of embedding generation
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                       processedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 total:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { search, processed } = req.query;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Build filters
    const filters: any = { siteId };

    if (search) {
      filters.fileName = { contains: search as string, mode: 'insensitive' };
    }

    if (processed !== undefined) {
      filters.processed = processed === 'true';
    }

    const files = await prisma.knowledgeFile.findMany({
      where: filters,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        processed: true,
        uploadedAt: true,
        processedAt: true,
      },
    });

    res.json({
      files: files.map(file => ({
        ...file,
        fileSize: file.fileSize.toString(), // Convert BigInt to string
      })),
      total: files.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/files:
 *   post:
 *     summary: Upload a knowledge file
 *     description: Upload a PDF or TXT file to add to the site's knowledge base
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF or TXT file to upload (max 10MB)
 *             required:
 *               - file
 *     responses:
 *       201:
 *         description: File uploaded and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: File ID
 *                 fileName:
 *                   type: string
 *                   description: Original file name
 *                 fileType:
 *                   type: string
 *                   description: MIME type of the file
 *                 fileSize:
 *                   type: string
 *                   description: File size in bytes
 *                 chunks:
 *                   type: integer
 *                   description: Number of text chunks created
 *                 preview:
 *                   type: string
 *                   description: First 1000 characters of extracted content
 *                 message:
 *                   type: string
 *                   example: File uploaded and processed successfully
 *               required:
 *                 - id
 *                 - fileName
 *                 - fileType
 *                 - fileSize
 *                 - chunks
 *                 - message
 *       400:
 *         description: Bad request - invalid file or file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const { siteId } = req.params;

    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check file count limit (optional: e.g., 50 files per site)
    const fileCount = await prisma.knowledgeFile.count({
      where: { siteId },
    });

    const MAX_FILES_PER_SITE = 50;
    if (fileCount >= MAX_FILES_PER_SITE) {
      throw new AppError(400, `Maximum number of files (${MAX_FILES_PER_SITE}) reached for this site`);
    }

    // Process the uploaded file
    const result = await processUploadedFile(siteId, req.file);

    res.status(201).json({
      id: result.id,
      fileName: result.fileName,
      fileType: result.fileType,
      fileSize: result.fileSize.toString(),
      chunks: result.chunks,
      preview: result.content,
      message: 'File uploaded and processed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/files/{fileId}:
 *   get:
 *     summary: Get file details and content
 *     description: Retrieve detailed information about a specific knowledge file
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 fileType:
 *                   type: string
 *                 fileSize:
 *                   type: string
 *                 processed:
 *                   type: boolean
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                 processedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 content:
 *                   type: string
 *                   description: Full extracted text content
 *                 chunks:
 *                   type: integer
 *                   description: Number of text chunks
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:fileId', authenticate, async (req, res, next) => {
  try {
    const { siteId, fileId } = req.params;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Get file details
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, siteId },
    });

    if (!file) {
      throw new AppError(404, 'File not found');
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

    res.json({
      ...file,
      fileSize: file.fileSize.toString(),
      content,
      chunks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/files/{fileId}:
 *   delete:
 *     summary: Delete a knowledge file
 *     description: Delete a knowledge file and all associated embeddings
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File deleted successfully
 *               required:
 *                 - message
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:fileId', authenticate, async (req, res, next) => {
  try {
    const { siteId, fileId } = req.params;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Delete the file
    await deleteKnowledgeFile(fileId, siteId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/sites/{siteId}/files/{fileId}/reprocess:
 *   post:
 *     summary: Reprocess a knowledge file
 *     description: Regenerate embeddings for an existing knowledge file
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File reprocessing initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File reprocessing initiated
 *               required:
 *                 - message
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:fileId/reprocess', authenticate, async (req, res, next) => {
  try {
    const { siteId, fileId } = req.params;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check file exists
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, siteId },
    });

    if (!file) {
      throw new AppError(404, 'File not found');
    }

    // Find associated URL and content
    const tempUrl = await prisma.siteUrl.findFirst({
      where: {
        siteId,
        url: `file://${fileId}`,
      },
    });

    if (!tempUrl || !tempUrl.content) {
      throw new AppError(400, 'File content not available for reprocessing');
    }

    // Delete existing embeddings
    await prisma.embedding.deleteMany({
      where: { siteUrlId: tempUrl.id },
    });

    // Queue for reprocessing (this could be done immediately or via background job)
    // For now, we'll do it immediately
    const { generateEmbeddings } = await import('../services/embeddings');
    await generateEmbeddings(tempUrl.id, tempUrl.content);

    // Update processed timestamp
    await prisma.knowledgeFile.update({
      where: { id: fileId },
      data: { processedAt: new Date() },
    });

    res.json({ message: 'File reprocessing initiated' });
  } catch (error) {
    next(error);
  }
});

export default router;