import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Knowledge Files Schemas
 * Centralized Zod validation schemas for file upload and management with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// File query parameters schema
export const fileQuerySchema = z.object({
  search: z.string().optional().openapi({
    description: 'Search query for files',
    example: 'product manual',
  }),
  processed: z.enum(['true', 'false']).optional().openapi({
    description: 'Filter by processing status',
    example: 'true',
  }),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional().openapi({
    description: 'Filter by processing status',
    example: 'COMPLETED',
  }),
});

// Reprocess file schema
export const reprocessFileSchema = registry.register(
  'ReprocessFileRequest',
  z.object({
    fileId: z.string().uuid('Invalid file ID format').openapi({
      description: 'File ID to reprocess',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  }).openapi({
    description: 'Reprocess a knowledge file',
  })
);

// File params schema
export const fileParamsSchema = z.object({
  siteId: z.string().uuid('Invalid site ID format').openapi({
    description: 'Site unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  fileId: z.string().uuid('Invalid file ID format').optional().openapi({
    description: 'File unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
  }),
});

// File response schema
export const knowledgeFileSchema = registry.register(
  'KnowledgeFile',
  z.object({
    id: z.string().uuid().openapi({ description: 'File ID' }),
    siteId: z.string().uuid().openapi({ description: 'Associated site ID' }),
    fileName: z.string().openapi({ description: 'Original file name', example: 'product-manual.pdf' }),
    fileType: z.string().openapi({ description: 'MIME type', example: 'application/pdf' }),
    fileSize: z.number().int().openapi({ description: 'File size in bytes', example: 1048576 }),
    fileUrl: z.string().openapi({ description: 'URL to access the file' }),
    processed: z.boolean().openapi({ description: 'Whether file has been processed' }),
    uploadedAt: z.string().openapi({ description: 'Upload timestamp' }),
    processedAt: z.string().nullable().openapi({ description: 'Processing completion timestamp' }),
  }).openapi({
    description: 'Knowledge file information',
  })
);

// Allowed MIME types for file uploads
export const ALLOWED_FILE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
] as const;

// File upload constraints
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILENAME_LENGTH: 255,
  DANGEROUS_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.dll', '.com'],
} as const;

// Type exports
export type FileQuery = z.infer<typeof fileQuerySchema>;
export type ReprocessFileInput = z.infer<typeof reprocessFileSchema>;
export type FileParams = z.infer<typeof fileParamsSchema>;
