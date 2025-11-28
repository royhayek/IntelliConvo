/**
 * Migration Script: Organize Uploads Folder
 * Migrates existing files from flat structure to organized folder structure
 *
 * Old structure: uploads/{filename}
 * New structure: uploads/{fileType}/{siteId}/{filename}
 *
 * Usage: npx tsx src/scripts/migrate-uploads.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma';
import { settings } from '../lib/settings';
import { logger } from '../utils/logger';

interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * Migrate knowledge files to organized structure
 */
async function migrateKnowledgeFiles(stats: MigrationStats): Promise<void> {
  logger.info('Starting knowledge files migration...');

  const knowledgeFiles = await prisma.knowledgeFile.findMany({
    select: {
      id: true,
      siteId: true,
      fileName: true,
      fileUrl: true,
    },
  });

  logger.info(`Found ${knowledgeFiles.length} knowledge files to migrate`);
  stats.totalFiles += knowledgeFiles.length;

  for (const file of knowledgeFiles) {
    if (!file.fileUrl) continue;

    try {
      // Check if already migrated (contains /files/{siteId}/)
      if (file.fileUrl.includes('/files/')) {
        logger.info(`Skipping already migrated file: ${file.fileUrl}`);
        stats.skippedFiles++;
        continue;
      }

      const uploadDir = await settings.getUploadDir();
      const oldPath = path.join(process.cwd(), file.fileUrl);

      // Check if old file exists
      try {
        await fs.access(oldPath);
      } catch {
        logger.warn(`Old file not found, skipping: ${oldPath}`);
        stats.skippedFiles++;
        continue;
      }

      // Extract filename from old path
      const filename = path.basename(file.fileUrl);

      // Create new organized path
      const newDir = path.join(process.cwd(), uploadDir, 'files', file.siteId);
      const newPath = path.join(newDir, filename);
      const newUrlPath = `/${uploadDir}/files/${file.siteId}/${filename}`;

      // Create directory if it doesn't exist
      await fs.mkdir(newDir, { recursive: true });

      // Move file
      await fs.rename(oldPath, newPath);

      // Update database record
      await prisma.knowledgeFile.update({
        where: { id: file.id },
        data: { fileUrl: newUrlPath },
      });

      logger.info(`Migrated: ${file.fileUrl} -> ${newUrlPath}`);
      stats.migratedFiles++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to migrate file ${file.fileUrl}:`, error);
      stats.failedFiles++;
      stats.errors.push({
        file: file.fileUrl,
        error: errorMsg,
      });
    }
  }
}

/**
 * Migrate widget logos to organized structure
 */
async function migrateWidgetLogos(stats: MigrationStats): Promise<void> {
  logger.info('Starting widget logos migration...');

  const widgetSettings = await prisma.widgetSettings.findMany({
    where: {
      NOT: {
        launcherCustomIconUrl: null,
      },
    },
    select: {
      id: true,
      siteId: true,
      launcherCustomIconUrl: true,
    },
  });

  logger.info(`Found ${widgetSettings.length} widget logos to migrate`);
  stats.totalFiles += widgetSettings.length;

  for (const widgetSetting of widgetSettings) {
    if (!widgetSetting.launcherCustomIconUrl) continue;

    try {
      // Check if already migrated (contains /logos/{siteId}/)
      if (widgetSetting.launcherCustomIconUrl.includes('/logos/')) {
        logger.info(`Skipping already migrated logo: ${widgetSetting.launcherCustomIconUrl}`);
        stats.skippedFiles++;
        continue;
      }

      const uploadDir = await settings.getUploadDir();
      const oldPath = path.join(process.cwd(), widgetSetting.launcherCustomIconUrl);

      // Check if old file exists
      try {
        await fs.access(oldPath);
      } catch {
        logger.warn(`Old logo not found, skipping: ${oldPath}`);
        stats.skippedFiles++;
        continue;
      }

      // Extract filename from old path
      const filename = path.basename(widgetSetting.launcherCustomIconUrl);

      // Create new organized path
      const newDir = path.join(process.cwd(), uploadDir, 'logos', widgetSetting.siteId);
      const newPath = path.join(newDir, filename);
      const newUrlPath = `/${uploadDir}/logos/${widgetSetting.siteId}/${filename}`;

      // Create directory if it doesn't exist
      await fs.mkdir(newDir, { recursive: true });

      // Move file
      await fs.rename(oldPath, newPath);

      // Update database record
      await prisma.widgetSettings.update({
        where: { id: widgetSetting.id },
        data: { launcherCustomIconUrl: newUrlPath },
      });

      logger.info(`Migrated: ${widgetSetting.launcherCustomIconUrl} -> ${newUrlPath}`);
      stats.migratedFiles++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to migrate logo ${widgetSetting.launcherCustomIconUrl}:`, error);
      stats.failedFiles++;
      stats.errors.push({
        file: widgetSetting.launcherCustomIconUrl,
        error: errorMsg,
      });
    }
  }
}

/**
 * Clean up empty directories in old uploads folder
 */
async function cleanupEmptyDirectories(): Promise<void> {
  try {
    const uploadDir = await settings.getUploadDir();
    const uploadsPath = path.join(process.cwd(), uploadDir);

    // Check if uploads directory exists
    try {
      await fs.access(uploadsPath);
    } catch {
      logger.info('Uploads directory does not exist. Skipping cleanup.');
      return;
    }

    const entries = await fs.readdir(uploadsPath, { withFileTypes: true });

    // Only try to remove files that are not directories (old flat files)
    // The new organized structure (files/, logos/, avatars/) will remain
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(uploadsPath, entry.name);
        logger.warn(`Found orphaned file in uploads root: ${entry.name}`);
        // Don't automatically delete - let admin review
      }
    }

    logger.info('Cleanup check complete. Review any orphaned files manually.');
  } catch (error) {
    logger.error('Failed to cleanup directories:', error);
  }
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  logger.info('Starting uploads folder migration...');
  logger.info('This will reorganize files from flat structure to organized folders');

  const stats: MigrationStats = {
    totalFiles: 0,
    migratedFiles: 0,
    skippedFiles: 0,
    failedFiles: 0,
    errors: [],
  };

  try {
    // Migrate knowledge files
    await migrateKnowledgeFiles(stats);

    // Migrate widget logos
    await migrateWidgetLogos(stats);

    // Cleanup
    await cleanupEmptyDirectories();

    // Print summary
    logger.info('\n=== Migration Summary ===');
    logger.info(`Total files found: ${stats.totalFiles}`);
    logger.info(`Successfully migrated: ${stats.migratedFiles}`);
    logger.info(`Skipped (already migrated or not found): ${stats.skippedFiles}`);
    logger.info(`Failed: ${stats.failedFiles}`);

    if (stats.errors.length > 0) {
      logger.error('\n=== Errors ===');
      stats.errors.forEach(({ file, error }) => {
        logger.error(`${file}: ${error}`);
      });
    }

    logger.info('\nMigration complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
