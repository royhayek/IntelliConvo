/**
 * File attachment types
 */

export interface FileAttachment {
  name: string;
  type: string;
  data: string;
}

export interface FileUploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}
