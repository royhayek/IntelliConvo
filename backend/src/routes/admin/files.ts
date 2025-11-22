/**
 * Admin Files Routes
 * Route handlers for admin knowledge file management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminFileService } from '../../services/admin';
import { FileStatus } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/files:
 *   get:
 *     summary: Get paginated list of knowledge files
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      search,
      siteId,
      status,
      fileType,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminFileService.getFiles({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      siteId: siteId as string | undefined,
      status: status as FileStatus | undefined,
      fileType: fileType as string | undefined,
      sortBy: sortBy as 'uploadedAt' | 'processedAt' | 'fileName' | 'fileSize',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/files/types:
 *   get:
 *     summary: Get distinct file types for filtering
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/types',
  asyncHandler(async (_req, res) => {
    const types = await adminFileService.getFileTypes();
    res.json({ data: types });
  })
);

/**
 * @swagger
 * /api/v1/admin/files/stuck:
 *   get:
 *     summary: Get files stuck in processing
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stuck',
  asyncHandler(async (req, res) => {
    const { hours = '24' } = req.query;
    const files = await adminFileService.getStuckFiles(parseInt(hours as string, 10));
    res.json({ data: files });
  })
);

/**
 * @swagger
 * /api/v1/admin/files/{fileId}:
 *   get:
 *     summary: Get file by ID
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:fileId',
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const file = await adminFileService.getFileById(fileId);
    res.json({ data: file });
  })
);

/**
 * @swagger
 * /api/v1/admin/files/{fileId}:
 *   patch:
 *     summary: Update file status
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:fileId',
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { status, errorMessage } = req.body;

    const updatedFile = await adminFileService.updateFile(fileId, {
      status,
      errorMessage,
    });

    res.json({ data: updatedFile });
  })
);

/**
 * @swagger
 * /api/v1/admin/files/{fileId}:
 *   delete:
 *     summary: Delete file
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:fileId',
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const result = await adminFileService.deleteFile(fileId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/files/{fileId}/reprocess:
 *   post:
 *     summary: Mark file for reprocessing
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:fileId/reprocess',
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const result = await adminFileService.reprocessFile(fileId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/files/bulk/status:
 *   post:
 *     summary: Bulk update file status
 *     tags: [Admin - Files]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bulk/status',
  asyncHandler(async (req, res) => {
    const { fileIds, status } = req.body;
    const result = await adminFileService.bulkUpdateStatus(fileIds, status);
    res.json(result);
  })
);

export default router;
