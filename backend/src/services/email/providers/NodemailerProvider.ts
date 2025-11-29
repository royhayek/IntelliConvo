/**
 * Nodemailer Email Provider
 * SMTP-based email sending for development and production
 * Supports Ethereal (fake SMTP), SendGrid SMTP, Gmail, etc.
 */

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../../../utils/logger';
import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types';

export interface NodemailerConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export class NodemailerProvider implements EmailProvider {
  readonly name = 'nodemailer';
  private transporter: Transporter | null = null;
  private defaultFrom: EmailAddress;
  private previewUrl: string | null = null;

  constructor(config?: NodemailerConfig, defaultFrom?: EmailAddress) {
    this.defaultFrom = defaultFrom || {
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@intelliconvo.ai',
      name: process.env.EMAIL_FROM_NAME || 'IntelliConvo',
    };

    if (config) {
      this.transporter = nodemailer.createTransport(config);
    } else {
      // Try to create from environment variables
      this.initFromEnv();
    }
  }

  private initFromEnv(): void {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  /**
   * Create an Ethereal test account for development
   * Emails are captured and viewable at ethereal.email
   */
  async createEtherealAccount(): Promise<{ user: string; pass: string; previewUrl: string }> {
    try {
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info('Ethereal test account created', {
        user: testAccount.user,
        previewUrl: `https://ethereal.email/login`,
      });

      return {
        user: testAccount.user,
        pass: testAccount.pass,
        previewUrl: 'https://ethereal.email',
      };
    } catch (error) {
      logger.error('Failed to create Ethereal account', { error });
      throw error;
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'SMTP transport not configured',
      };
    }

    try {
      const from = options.from || this.defaultFrom;
      const fromString = from.name ? `"${from.name}" <${from.email}>` : from.email;

      // Normalize recipients
      const toAddresses = this.normalizeRecipients(options.to);

      const info = await this.transporter.sendMail({
        from: fromString,
        to: toAddresses.join(', '),
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo
          ? typeof options.replyTo === 'string'
            ? options.replyTo
            : options.replyTo.email
          : undefined,
        cc: options.cc ? this.normalizeRecipients(options.cc).join(', ') : undefined,
        bcc: options.bcc ? this.normalizeRecipients(options.bcc).join(', ') : undefined,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      // Get Ethereal preview URL if applicable
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.previewUrl = previewUrl as string;
        logger.info('Email preview URL (Ethereal)', { previewUrl });
      }

      logger.info('Email sent via Nodemailer', {
        messageId: info.messageId,
        to: toAddresses,
        subject: options.subject,
        previewUrl: previewUrl || undefined,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Nodemailer email send error', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verify(): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Nodemailer provider not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Nodemailer provider verified successfully');
      return true;
    } catch (error) {
      logger.error('Nodemailer provider verification failed', { error });
      return false;
    }
  }

  getLastPreviewUrl(): string | null {
    return this.previewUrl;
  }

  private normalizeRecipients(
    recipients: string | EmailAddress | (string | EmailAddress)[]
  ): string[] {
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    return recipientArray.map((r) => (typeof r === 'string' ? r : r.email));
  }
}
