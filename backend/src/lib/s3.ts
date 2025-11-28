/**
 * AWS S3 Client
 * Handles file storage operations with Amazon S3
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

let s3Client: S3Client | null = null;
let isConfigured = false;
let s3Bucket: string | null = null;
let s3Region: string | null = null;
let s3PublicUrl: string | null = null;

/**
 * Initialize S3 client with AWS credentials
 */
export function initializeS3(): void {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;
  const publicUrl = process.env.AWS_S3_PUBLIC_URL; // Optional CDN URL

  // Check if all required credentials are provided
  if (!accessKeyId || !secretAccessKey || !bucket) {
    logger.info('📦 S3 storage not configured - using local storage');
    isConfigured = false;
    s3Client = null;
    return;
  }

  // Validate credentials are not placeholder values
  if (
    accessKeyId === 'your-aws-access-key-id' ||
    secretAccessKey === 'your-aws-secret-access-key' ||
    bucket === 'your-s3-bucket-name'
  ) {
    logger.warn('⚠️  S3 credentials appear to be placeholders - using local storage');
    isConfigured = false;
    s3Client = null;
    return;
  }

  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    s3Bucket = bucket;
    s3Region = region;
    s3PublicUrl = publicUrl || null;
    isConfigured = true;

    logger.info('📦 S3 storage initialized', {
      bucket,
      region,
      hasCustomUrl: !!publicUrl,
    });
  } catch (error) {
    logger.error('Failed to initialize S3 client:', error);
    isConfigured = false;
    s3Client = null;
  }
}

/**
 * Check if S3 is configured and available
 */
export function isS3Configured(): boolean {
  return isConfigured && s3Client !== null && s3Bucket !== null;
}

/**
 * Get S3 configuration
 */
export function getS3Config() {
  return {
    isConfigured,
    bucket: s3Bucket,
    region: s3Region,
    publicUrl: s3PublicUrl,
  };
}

/**
 * Upload file to S3
 * @param key - S3 object key (file path)
 * @param buffer - File buffer
 * @param contentType - MIME type
 * @returns Public URL of uploaded file
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!isS3Configured() || !s3Client || !s3Bucket) {
    throw new Error('S3 is not configured');
  }

  try {
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Make file publicly readable
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return public URL
    if (s3PublicUrl) {
      // Use custom CDN URL if provided
      return `${s3PublicUrl}/${key}`;
    } else {
      // Use standard S3 URL
      return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
    }
  } catch (error) {
    logger.error('Failed to upload file to S3:', error);
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from S3
 * @param key - S3 object key (file path)
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (!isS3Configured() || !s3Client || !s3Bucket) {
    throw new Error('S3 is not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('Failed to delete file from S3:', error);
    throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file exists in S3
 * @param key - S3 object key (file path)
 * @returns True if file exists
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
  if (!isS3Configured() || !s3Client || !s3Bucket) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: s3Bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract S3 key from URL
 * @param url - Full S3 URL
 * @returns S3 object key
 */
export function extractS3Key(url: string): string {
  // Handle custom CDN URL
  if (s3PublicUrl && url.startsWith(s3PublicUrl)) {
    return url.substring(s3PublicUrl.length + 1);
  }

  // Handle standard S3 URL
  if (s3Bucket && url.includes(s3Bucket)) {
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex((part) => part.includes(s3Bucket!));
    return urlParts.slice(bucketIndex + 1).join('/');
  }

  // If URL doesn't match expected format, return as-is
  return url;
}

/**
 * Delete all files in an S3 directory (by prefix)
 * @param prefix - Directory prefix (e.g., 'files/siteId/')
 */
export async function deleteS3Directory(prefix: string): Promise<void> {
  if (!isS3Configured() || !s3Client || !s3Bucket) {
    throw new Error('S3 is not configured');
  }

  try {
    // List all objects with the given prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: s3Bucket,
      Prefix: prefix,
    });

    const listedObjects = await s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      logger.info(`No objects found in S3 with prefix: ${prefix}`);
      return;
    }

    // Delete all objects (max 1000 at a time)
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: s3Bucket,
      Delete: {
        Objects: listedObjects.Contents.map((item) => ({ Key: item.Key })),
        Quiet: true,
      },
    });

    await s3Client.send(deleteCommand);
    logger.info(`Deleted ${listedObjects.Contents.length} objects from S3 with prefix: ${prefix}`);

    // If there are more objects (>1000), recursively delete them
    if (listedObjects.IsTruncated) {
      await deleteS3Directory(prefix);
    }
  } catch (error) {
    logger.error(`Failed to delete S3 directory with prefix ${prefix}:`, error);
    throw new Error(`S3 directory delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Initialize on module load
initializeS3();
