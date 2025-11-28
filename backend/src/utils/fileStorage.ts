/**
 * File Storage Utility
 * Centralized file storage management with organized folder structure
 * Supports both local storage and AWS S3
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { settings } from '../lib/settings';
import { logger } from './logger';
import { prisma } from '../lib/prisma';
import {
  isS3Configured,
  uploadToS3,
  deleteFromS3,
  fileExistsInS3,
  extractS3Key,
  deleteS3Directory,
} from '../lib/s3';

/**
 * File types for organized storage
 */
export enum FileType {
  LOGO = 'logos',
  KNOWLEDGE = 'files',
  AVATAR = 'avatars',
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * File storage configuration
 */
interface FileStorageOptions {
  fileType: FileType;
  siteId: string;
  buffer: Buffer;
  originalName: string;
  fileHash?: string;
}

/**
 * Generate organized file path
 * Structure: uploads/{fileType}/{siteId}/{filename}
 */
export async function getOrganizedFilePath(options: FileStorageOptions): Promise<{
  filePath: string;
  urlPath: string;
  fileName: string;
}> {
  const { fileType, siteId, originalName, buffer, fileHash } = options;

  // Get upload directory from settings
  const uploadDir = await settings.getUploadDir();

  // Generate hash if not provided
  const hash = fileHash || crypto.createHash('md5').update(buffer).digest('hex');

  // Get file extension
  const ext = path.extname(originalName);

  // Generate filename based on file type
  let fileName: string;
  switch (fileType) {
    case FileType.LOGO:
      fileName = `logo-${hash}${ext}`;
      break;
    case FileType.KNOWLEDGE:
      fileName = `${hash}${ext}`;
      break;
    case FileType.AVATAR:
      fileName = `avatar-${hash}${ext}`;
      break;
    default:
      fileName = `${hash}${ext}`;
  }

  // Create organized directory structure
  const typeDir = path.join(uploadDir, fileType, siteId);
  const fullPath = path.join(process.cwd(), typeDir);
  const filePath = path.join(fullPath, fileName);

  // URL path for database storage and serving
  const urlPath = `/${typeDir}/${fileName}`;

  return { filePath, urlPath, fileName };
}

/**
 * Save file to organized storage (S3 or local)
 */
export async function saveFile(options: FileStorageOptions): Promise<string> {
  try {
    const { buffer, originalName } = options;

    // Check if S3 is configured
    if (isS3Configured()) {
      // Use S3 storage
      const { fileName } = await getOrganizedFilePath(options);
      const { fileType, siteId } = options;

      // Create S3 key with organized path
      const s3Key = `${fileType}/${siteId}/${fileName}`;
      const contentType = getMimeType(originalName);

      // Upload to S3
      const s3Url = await uploadToS3(s3Key, buffer, contentType);

      logger.info(`File saved to S3: ${s3Url}`);
      return s3Url;
    } else {
      // Use local storage
      const { filePath, urlPath } = await getOrganizedFilePath(options);

      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Save file
      await fs.writeFile(filePath, buffer);

      logger.info(`File saved locally: ${urlPath}`);
      return urlPath;
    }
  } catch (error) {
    logger.error('Failed to save file:', error);
    throw new Error('Failed to save file to storage');
  }
}

/**
 * Delete file from storage (S3 or local)
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Check if this is an S3 URL
    if (isS3Configured() && (fileUrl.startsWith('https://') || fileUrl.startsWith('http://'))) {
      // Delete from S3
      const s3Key = extractS3Key(fileUrl);
      await deleteFromS3(s3Key);
      logger.info(`File deleted from S3: ${fileUrl}`);
    } else {
      // Delete from local storage
      const filePath = path.join(process.cwd(), fileUrl);
      await fs.unlink(filePath);
      logger.info(`File deleted locally: ${fileUrl}`);
    }
  } catch (error) {
    // File might not exist, log warning but don't throw
    logger.warn(`Failed to delete file: ${fileUrl}`, error);
  }
}

/**
 * Check if file exists (S3 or local)
 */
export async function fileExists(fileUrl: string): Promise<boolean> {
  try {
    // Check if this is an S3 URL
    if (isS3Configured() && (fileUrl.startsWith('https://') || fileUrl.startsWith('http://'))) {
      // Check in S3
      const s3Key = extractS3Key(fileUrl);
      return await fileExistsInS3(s3Key);
    } else {
      // Check in local storage
      const filePath = path.join(process.cwd(), fileUrl);
      await fs.access(filePath);
      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Get file size (local storage only)
 */
export async function getFileSize(fileUrl: string): Promise<number> {
  try {
    const filePath = path.join(process.cwd(), fileUrl);
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    logger.error(`Failed to get file size: ${fileUrl}`, error);
    throw new Error('Failed to get file size');
  }
}

/**
 * Get current storage type
 */
export function getStorageType(): 'S3' | 'LOCAL' {
  return isS3Configured() ? 'S3' : 'LOCAL';
}

/**
 * Get storage information
 */
export function getStorageInfo() {
  const storageType = getStorageType();
  if (storageType === 'S3') {
    const { isS3Configured: isConfigured, getS3Config } = require('../lib/s3');
    return {
      type: 'S3',
      ...getS3Config(),
    };
  }
  return {
    type: 'LOCAL',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  };
}

/**
 * Delete all files for a specific site
 * Removes knowledge files and widget logo
 */
export async function deleteSiteFiles(siteId: string): Promise<void> {
  try {
    logger.info(`Starting file cleanup for site: ${siteId}`);
    let deletedCount = 0;

    // Delete all knowledge files
    const knowledgeFiles = await prisma.knowledgeFile.findMany({
      where: { siteId },
      select: { fileUrl: true },
    });

    for (const file of knowledgeFiles) {
      if (file.fileUrl) {
        await deleteFile(file.fileUrl);
        deletedCount++;
      }
    }

    // Delete widget logo if exists
    const widgetSettings = await prisma.widgetSettings.findUnique({
      where: { siteId },
      select: { launcherCustomIconUrl: true },
    });

    if (widgetSettings?.launcherCustomIconUrl) {
      await deleteFile(widgetSettings.launcherCustomIconUrl);
      deletedCount++;
    }

    // If using local storage, try to delete the site's directory
    if (!isS3Configured()) {
      const uploadDir = await settings.getUploadDir();

      // Try to delete directories for each file type
      const fileTypes = [FileType.KNOWLEDGE, FileType.LOGO, FileType.AVATAR];
      for (const fileType of fileTypes) {
        const siteDir = path.join(process.cwd(), uploadDir, fileType, siteId);
        try {
          await fs.rm(siteDir, { recursive: true, force: true });
          logger.info(`Deleted directory: ${siteDir}`);
        } catch (error) {
          // Directory might not exist, ignore error
        }
      }
    } else {
      // If using S3, delete the site's directories
      const fileTypes = [FileType.KNOWLEDGE, FileType.LOGO, FileType.AVATAR];
      for (const fileType of fileTypes) {
        const prefix = `${fileType}/${siteId}/`;
        try {
          await deleteS3Directory(prefix);
          logger.info(`Deleted S3 directory: ${prefix}`);
        } catch (error) {
          logger.warn(`Failed to delete S3 directory ${prefix}:`, error);
        }
      }
    }

    logger.info(`File cleanup completed for site ${siteId}: ${deletedCount} files deleted`);
  } catch (error) {
    logger.error(`Failed to cleanup files for site ${siteId}:`, error);
    // Don't throw - allow site deletion to continue even if file cleanup fails
  }
}

/**
 * Delete all files for all sites owned by a user
 */
export async function deleteUserFiles(userId: string): Promise<void> {
  try {
    logger.info(`Starting file cleanup for user: ${userId}`);

    // Get all sites owned by this user
    const userSites = await prisma.site.findMany({
      where: { userId },
      select: { id: true, siteName: true },
    });

    logger.info(`Found ${userSites.length} sites for user ${userId}`);

    // Delete files for each site
    for (const site of userSites) {
      await deleteSiteFiles(site.id);
    }

    logger.info(`File cleanup completed for user ${userId}: ${userSites.length} sites processed`);
  } catch (error) {
    logger.error(`Failed to cleanup files for user ${userId}:`, error);
    // Don't throw - allow user deletion to continue even if file cleanup fails
  }
}
