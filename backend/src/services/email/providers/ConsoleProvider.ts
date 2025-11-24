/**
 * Console Email Provider
 * Logs emails to console for development/debugging
 * No actual emails are sent
 */

import { logger } from '../../../utils/logger';
import {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types';

export class ConsoleProvider implements EmailProvider {
  readonly name = 'console';

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = this.normalizeRecipients(options.to);
    const messageId = `console-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log('\n' + '='.repeat(60));
    console.log('EMAIL (Console Provider - Not Sent)');
    console.log('='.repeat(60));
    console.log(`Message ID: ${messageId}`);
    console.log(`To: ${recipients.join(', ')}`);
    console.log(`Subject: ${options.subject}`);
    if (options.from) {
      const from = options.from;
      console.log(`From: ${from.name ? `${from.name} <${from.email}>` : from.email}`);
    }
    if (options.replyTo) {
      const replyTo = options.replyTo;
      console.log(
        `Reply-To: ${typeof replyTo === 'string' ? replyTo : replyTo.email}`
      );
    }
    console.log('-'.repeat(60));
    console.log('HTML Content:');
    console.log('-'.repeat(60));
    // Truncate HTML for console output
    const htmlPreview = options.html.length > 500
      ? options.html.substring(0, 500) + '...[truncated]'
      : options.html;
    console.log(htmlPreview);
    if (options.text) {
      console.log('-'.repeat(60));
      console.log('Text Content:');
      console.log('-'.repeat(60));
      console.log(options.text);
    }
    console.log('='.repeat(60) + '\n');

    logger.info('Email logged to console', {
      messageId,
      to: recipients,
      subject: options.subject,
      provider: this.name,
    });

    return {
      success: true,
      messageId,
    };
  }

  async verify(): Promise<boolean> {
    logger.info('Console email provider active (emails will be logged, not sent)');
    return true;
  }

  private normalizeRecipients(
    recipients: string | EmailAddress | (string | EmailAddress)[]
  ): string[] {
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    return recipientArray.map((r) => (typeof r === 'string' ? r : r.email));
  }
}
