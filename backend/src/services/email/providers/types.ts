/**
 * Email Provider Types
 * Defines the interface for email providers
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | EmailAddress | (string | EmailAddress)[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: string | EmailAddress;
  cc?: string | EmailAddress | (string | EmailAddress)[];
  bcc?: string | EmailAddress | (string | EmailAddress)[];
  attachments?: EmailAttachment[];
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email Provider Interface
 * All email providers must implement this interface
 */
export interface EmailProvider {
  readonly name: string;

  /**
   * Send an email
   * @param options - Email options
   * @returns Result with success status and message ID
   */
  send(options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Verify the provider is properly configured
   * @returns True if configured correctly
   */
  verify(): Promise<boolean>;
}

export type EmailProviderType = 'resend' | 'nodemailer' | 'console';
