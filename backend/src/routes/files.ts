/**
 * Files Routes
 * Route handlers for knowledge file management using FileService
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateParams, validateQuery } from '../middleware/validate';
import { messageResponse } from '../utils/response';
import { fileService } from '../services/file/FileService';
import { AppError, ErrorCode } from '../middleware/errors';
import {
  fileQuerySchema,
  ALLOWED_FILE_MIME_TYPES,
  FILE_UPLOAD_CONSTRAINTS,
} from '../schemas';
import { z } from 'zod';

const router = Router({ mergeParams: true });

// Import constants
const { MAX_FILE_SIZE, DANGEROUS_EXTENSIONS, MAX_FILENAME_LENGTH } = FILE_UPLOAD_CONSTRAINTS;

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fieldSize: 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!ALLOWED_FILE_MIME_TYPES.includes(file.mimetype as any)) {
      const allowedTypesStr = ALLOWED_FILE_MIME_TYPES.join(', ');
      return cb(
        new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          `File type not supported. Allowed types: ${allowedTypesStr}`
        )
      );
    }

    // Validate file name length
    if (!file.originalname || file.originalname.length > MAX_FILENAME_LENGTH) {
      return cb(
        new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          `File name must be less than ${MAX_FILENAME_LENGTH} characters`
        )
      );
    }

    // Check for dangerous extensions
    const fileExt = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (DANGEROUS_EXTENSIONS.includes(fileExt as any)) {
      return cb(
        new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          'File extension not allowed for security reasons'
        )
      );
    }

    cb(null, true);
  },
});

// Validation schemas
const siteParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
});

const fileParamsSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  fileId: z.string().min(1, 'File ID is required'),
});

// ============================================
// File Management
// ============================================

/**
 * @swagger
 * /api/v1/sites/{siteId}/files:
 *   get:
 *     summary: Get all knowledge files for a site
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  validateParams(siteParamsSchema),
  validateQuery(fileQuerySchema),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const { search, processed, status } = req.query;

    const result = await fileService.getSiteFiles(
      siteId,
      req.user!.id,
      {
        search: search as string,
        processed: processed === 'true',
        status: status as string,
      }
    );

    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/files/{fileId}:
 *   get:
 *     summary: Get file details
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:fileId',
  authenticate,
  validateParams(fileParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, fileId } = req.params;

    const file = await fileService.getFileById(
      siteId,
      fileId,
      req.user!.id
    );

    res.json(file);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/files:
 *   post:
 *     summary: Upload a knowledge file
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  validateParams(siteParamsSchema),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { siteId } = req.params;

    if (!req.file) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'No file provided');
    }

    const result = await fileService.uploadFile(siteId, req.user!.id, req.file);

    res.status(201).json(result);
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/files/{fileId}:
 *   delete:
 *     summary: Delete a knowledge file
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:fileId',
  authenticate,
  validateParams(fileParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, fileId } = req.params;

    await fileService.deleteFile(siteId, fileId, req.user!.id);

    res.status(204).send();
  })
);

/**
 * @swagger
 * /api/v1/sites/{siteId}/files/{fileId}/reprocess:
 *   post:
 *     summary: Reprocess a knowledge file
 *     tags: [Knowledge Files]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:fileId/reprocess',
  authenticate,
  validateParams(fileParamsSchema),
  asyncHandler(async (req, res) => {
    const { siteId, fileId } = req.params;

    await fileService.reprocessFile(siteId, fileId, req.user!.id);

    res.json(messageResponse('File reprocessing completed successfully'));
  })
);

export default router;
