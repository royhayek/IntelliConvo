/**
 * Handler dependencies interfaces
 */

import { Socket } from 'socket.io-client';
import { Message, WidgetSettings } from '.';
import { AnalyticsEventData } from './analytics';
import { FileAttachment, FileUploadProgress } from './file';
import { RateLimiter } from '../utils/performance';

export interface FileHandlerDependencies {
  settings: WidgetSettings | null;
  pendingFiles: File[];
  showErrorMessage: (message: string) => void;
  trackAnalyticsEvent: (eventName: string, eventData?: AnalyticsEventData) => void;
  sanitizeHtml: (html: string) => string;
  rateLimiter: RateLimiter;
  onUploadProgress?: (progress: FileUploadProgress) => void;
}

export interface MessageHandlerDependencies {
  getSocket: () => Socket | null;
  sessionId: string;
  siteId: string;
  settings: WidgetSettings | null;
  messages: Message[];
  isConnected: () => boolean;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  setTyping: (typing: boolean) => void;
  trackAnalyticsEvent: (eventName: string, eventData?: AnalyticsEventData) => void;
  saveConversation: () => void;
  showErrorMessage: (message: string) => void;
  prepareFileAttachments?: () => Promise<FileAttachment[]>;
  clearPendingFiles?: () => void;
  updateFilePreview?: () => void;
  rateLimiter: RateLimiter;
}

export interface VoiceHandlerDependencies {
  settings: WidgetSettings | null;
  sendMessage: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface MessageData {
  sessionId: string;
  siteId: string;
  content: string;
  messageId: string;
  attachments?: FileAttachment[];
}
