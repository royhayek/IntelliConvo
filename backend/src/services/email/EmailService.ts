/**
 * Email Service
 * Main service for sending emails with queue support and logging
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { settings } from '../../lib/settings';
import { EmailType, EmailStatus } from '@prisma/client';
import { createEmailProvider, EmailProvider, SendEmailOptions } from './providers';
import { renderEmailTemplate, EmailTemplateData } from './templates';

export interface SendEmailInput<T extends keyof EmailTemplateData> {
  to: string;
  type: T;
  data: EmailTemplateData[T];
  userId?: string;
}

export interface EmailLogDTO {
  id: string;
  email: string;
  type: EmailType;
  subject: string;
  status: EmailStatus;
  sentAt: string | null;
  createdAt: string;
  errorMessage: string | null;
}

/**
 * EmailService class
 * Handles all email-related business logic
 */
export class EmailService {
  private provider: EmailProvider | null = null;
  private initialized = false;

  /**
   * Initialize the email service
   * Must be called before sending emails
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.provider = await createEmailProvider();
      const isValid = await this.provider.verify();

      if (isValid) {
        logger.info(`Email service initialized with provider: ${this.provider.name}`);
      } else {
        logger.warn(`Email provider ${this.provider.name} failed verification`);
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize email service', { error });
      throw error;
    }
  }

  /**
   * Get the current email provider
   */
  getProvider(): EmailProvider | null {
    return this.provider;
  }

  /**
   * Send an email using a template
   * @param input - Email input with type and template data
   * @returns Email log ID
   */
  async sendEmail<T extends keyof EmailTemplateData>(input: SendEmailInput<T>): Promise<string> {
    const { to, type, data, userId } = input;

    // Ensure initialized
    if (!this.provider) {
      await this.initialize();
    }

    // Get email configuration from settings
    const [fromEmail, fromName, platformName, supportEmail] = await Promise.all([
      settings.getFromEmail(),
      settings.getFromName(),
      settings.getPlatformName(),
      settings.getSupportEmail(),
    ]);

    // Render the template
    const templateData = {
      ...data,
      platformName,
      supportEmail,
    } as EmailTemplateData[T];

    const { subject, html, text } = renderEmailTemplate(type, templateData);

    // Create email log entry
    const emailLog = await prisma.emailLog.create({
      data: {
        userId,
        email: to,
        type: type as EmailType,
        subject,
        status: EmailStatus.PENDING,
        templateData: data as any,
        provider: this.provider?.name,
      },
    });

    try {
      // Send the email
      const result = await this.provider!.send({
        to,
        subject,
        html,
        text,
        from: { email: fromEmail, name: fromName },
      });

      if (result.success) {
        // Update log as sent
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: EmailStatus.SENT,
            messageId: result.messageId,
            sentAt: new Date(),
            attempts: 1,
            lastAttemptAt: new Date(),
          },
        });

        logger.info(`Email sent successfully`, {
          emailLogId: emailLog.id,
          to,
          type,
          messageId: result.messageId,
        });
      } else {
        // Update log as failed
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: result.error,
            attempts: 1,
            lastAttemptAt: new Date(),
          },
        });

        logger.error('Email send failed', {
          emailLogId: emailLog.id,
          to,
          type,
          error: result.error,
        });
      }

      return emailLog.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update log as failed
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          errorMessage,
          attempts: 1,
          lastAttemptAt: new Date(),
        },
      });

      logger.error('Email send error', {
        emailLogId: emailLog.id,
        to,
        type,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Send email directly without template (for custom emails)
   */
  async sendRawEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.provider) {
      await this.initialize();
    }

    const [fromEmail, fromName] = await Promise.all([
      settings.getFromEmail(),
      settings.getFromName(),
    ]);

    return this.provider!.send({
      ...options,
      from: options.from || { email: fromEmail, name: fromName },
    });
  }

  /**
   * Get email logs for a user
   */
  async getEmailLogs(userId: string, limit = 50): Promise<EmailLogDTO[]> {
    const logs = await prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(this.mapEmailLogToDTO);
  }

  /**
   * Get all email logs (admin)
   */
  async getAllEmailLogs(options: {
    limit?: number;
    offset?: number;
    type?: EmailType;
    status?: EmailStatus;
  }): Promise<{ logs: EmailLogDTO[]; total: number }> {
    const { limit = 50, offset = 0, type, status } = options;

    const where = {
      ...(type && { type }),
      ...(status && { status }),
    };

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return {
      logs: logs.map(this.mapEmailLogToDTO),
      total,
    };
  }

  /**
   * Retry a failed email
   */
  async retryEmail(emailLogId: string): Promise<boolean> {
    const emailLog = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!emailLog) {
      throw new Error('Email log not found');
    }

    if (emailLog.status !== EmailStatus.FAILED) {
      throw new Error('Can only retry failed emails');
    }

    // Re-send using stored template data
    try {
      await this.sendEmail({
        to: emailLog.email,
        type: emailLog.type,
        data: emailLog.templateData as any,
        userId: emailLog.userId || undefined,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private mapEmailLogToDTO(log: any): EmailLogDTO {
    return {
      id: log.id,
      email: log.email,
      type: log.type,
      subject: log.subject,
      status: log.status,
      sentAt: log.sentAt?.toISOString() || null,
      createdAt: log.createdAt.toISOString(),
      errorMessage: log.errorMessage,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
