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
    fileName: z.string().openapi({ description: 'File name', example: 'product-manual.pdf' }),
    originalName: z.string().optional().openapi({ description: 'Original file name', example: 'product-manual.pdf' }),
    fileType: z.string().openapi({ description: 'MIME type', example: 'application/pdf' }),
    fileSize: z.number().int().openapi({ description: 'File size in bytes', example: 1048576 }),
    fileUrl: z.string().openapi({ description: 'URL to access the file' }),
    processed: z.boolean().openapi({ description: 'Whether file has been processed' }),
    embeddingStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional().openapi({ description: 'Embedding processing status' }),
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
// Note: MAX_FILE_SIZE here is a hard cap for multer middleware.
// The actual dynamic limit is checked in fileProcessor.ts using database settings.
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB hard cap - actual limit from DB settings
  MAX_FILENAME_LENGTH: 255,
  DANGEROUS_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.dll', '.com'],
} as const;

// Files list response schema
export const filesListResponseSchema = registry.register(
  'FilesListResponse',
  z.object({
    files: z.array(knowledgeFileSchema),
    total: z.number().int().openapi({ description: 'Total number of files' }),
  }).openapi({
    description: 'List of knowledge files',
  })
);

// File upload response schema
export const fileUploadResponseSchema = registry.register(
  'FileUploadResponse',
  z.object({
    file: knowledgeFileSchema,
    message: z.string().openapi({ description: 'Success message' }),
  }).openapi({
    description: 'File upload response',
  })
);

// Message response schema (for simple success messages)
export const messageResponseSchema = registry.register(
  'MessageResponse',
  z.object({
    message: z.string().openapi({ description: 'Response message' }),
  }).openapi({
    description: 'Simple message response',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/sites/{siteId}/files
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/files',
  summary: 'Get all knowledge files for a site',
  tags: ['Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    }),
    query: fileQuerySchema,
  },
  responses: {
    200: {
      description: 'Successfully retrieved files',
      content: {
        'application/json': {
          schema: filesListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/sites/{siteId}/files/{fileId}
registry.registerPath({
  method: 'get',
  path: '/api/v1/sites/{siteId}/files/{fileId}',
  summary: 'Get file details',
  tags: ['Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      fileId: z.string().uuid().openapi({ description: 'File ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved file',
      content: {
        'application/json': {
          schema: knowledgeFileSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'File not found',
    },
  },
});

// POST /api/v1/sites/{siteId}/files
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/files',
  summary: 'Upload a knowledge file',
  tags: ['Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
    }),
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({ description: 'File to upload', type: 'string', format: 'binary' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'File uploaded successfully',
      content: {
        'application/json': {
          schema: fileUploadResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid file',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// DELETE /api/v1/sites/{siteId}/files/{fileId}
registry.registerPath({
  method: 'delete',
  path: '/api/v1/sites/{siteId}/files/{fileId}',
  summary: 'Delete a knowledge file',
  tags: ['Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      fileId: z.string().uuid().openapi({ description: 'File ID' }),
    }),
  },
  responses: {
    200: {
      description: 'File deleted successfully',
      content: {
        'application/json': {
          schema: messageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'File not found',
    },
  },
});

// POST /api/v1/sites/{siteId}/files/{fileId}/reprocess
registry.registerPath({
  method: 'post',
  path: '/api/v1/sites/{siteId}/files/{fileId}/reprocess',
  summary: 'Reprocess a knowledge file',
  tags: ['Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().uuid().openapi({ description: 'Site ID' }),
      fileId: z.string().uuid().openapi({ description: 'File ID' }),
    }),
  },
  responses: {
    200: {
      description: 'File reprocessing started',
      content: {
        'application/json': {
          schema: messageResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'File not found',
    },
  },
});

// Type exports
export type FileQuery = z.infer<typeof fileQuerySchema>;
export type ReprocessFileInput = z.infer<typeof reprocessFileSchema>;
export type FileParams = z.infer<typeof fileParamsSchema>;
