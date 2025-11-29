/**
 * Resend Email Provider
 * Modern email API with excellent developer experience
 * Free tier: 3,000 emails/month
 * https://resend.com
 */

import { Resend } from 'resend';
import { logger } from '../../../utils/logger';
import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types';

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private client: Resend | null = null;
  private defaultFrom: EmailAddress;

  constructor(apiKey?: string, defaultFrom?: EmailAddress) {
    const key = apiKey || process.env.RESEND_API_KEY;

    if (key) {
      this.client = new Resend(key);
    }

    this.defaultFrom = defaultFrom || {
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@intelliconvo.ai',
      name: process.env.EMAIL_FROM_NAME || 'IntelliConvo',
    };
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Resend API key not configured',
      };
    }

    try {
      const from = options.from || this.defaultFrom;
      const fromString = from.name ? `${from.name} <${from.email}>` : from.email;

      // Normalize recipients to array of strings
      const toAddresses = this.normalizeRecipients(options.to);

      const { data, error } = await this.client.emails.send({
        from: fromString,
        to: toAddresses,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo
          ? typeof options.replyTo === 'string'
            ? options.replyTo
            : options.replyTo.email
          : undefined,
        cc: options.cc ? this.normalizeRecipients(options.cc) : undefined,
        bcc: options.bcc ? this.normalizeRecipients(options.bcc) : undefined,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content:
            typeof att.content === 'string'
              ? Buffer.from(att.content)
              : att.content,
        })),
        tags: options.tags,
      });

      if (error) {
        logger.error('Resend email send failed', { error, to: toAddresses });
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('Email sent via Resend', {
        messageId: data?.id,
        to: toAddresses,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Resend email send error', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verify(): Promise<boolean> {
    if (!this.client) {
      logger.warn('Resend provider not configured - missing API key');
      return false;
    }

    try {
      // Verify by listing domains (lightweight API call)
      await this.client.domains.list();
      logger.info('Resend provider verified successfully');
      return true;
    } catch (error) {
      logger.error('Resend provider verification failed', { error });
      return false;
    }
  }

  private normalizeRecipients(
    recipients: string | EmailAddress | (string | EmailAddress)[]
  ): string[] {
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    return recipientArray.map((r) => (typeof r === 'string' ? r : r.email));
  }
}
