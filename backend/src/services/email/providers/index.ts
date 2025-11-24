/**
 * Email Providers Index
 * Factory function to create the appropriate email provider
 */

export * from './types';
export { ResendProvider } from './ResendProvider';
export { NodemailerProvider } from './NodemailerProvider';
export { ConsoleProvider } from './ConsoleProvider';

import { logger } from '../../../utils/logger';
import { settings } from '../../../lib/settings';
import { EmailProvider, EmailProviderType } from './types';
import { ResendProvider } from './ResendProvider';
import { NodemailerProvider } from './NodemailerProvider';
import { ConsoleProvider } from './ConsoleProvider';

/**
 * Create an email provider based on configuration
 * Priority:
 * 1. Explicitly specified provider type
 * 2. Database setting (email.provider)
 * 3. Auto-detect from environment variables
 * 4. Console (fallback for development)
 */
export async function createEmailProvider(
  providerType?: EmailProviderType
): Promise<EmailProvider> {
  // Explicit provider type
  if (providerType) {
    return createProviderByType(providerType);
  }

  // Check database settings first
  const settingsProvider = await settings.getEmailProvider();
  if (settingsProvider && settingsProvider !== 'auto') {
    logger.info(`Using email provider from settings: ${settingsProvider}`);
    return createProviderByType(settingsProvider as EmailProviderType);
  }

  // Auto-detect based on environment variables
  const type = detectProviderType();
  return createProviderByType(type);
}

function detectProviderType(): EmailProviderType {
  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }

  if (process.env.SMTP_HOST) {
    return 'nodemailer';
  }

  // Default to console in development, warn in production
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      'No email provider configured in production. Emails will be logged to console only.'
    );
  }

  return 'console';
}

async function createProviderByType(type: EmailProviderType): Promise<EmailProvider> {
  switch (type) {
    case 'resend':
      logger.info('Using Resend email provider');
      return new ResendProvider();

    case 'nodemailer': {
      logger.info('Using Nodemailer email provider');
      const provider = new NodemailerProvider();

      // If no SMTP config but we want nodemailer, create Ethereal account
      const isConfigured = await provider.verify();
      if (!isConfigured && process.env.NODE_ENV !== 'production') {
        logger.info('Creating Ethereal test account for email preview');
        await provider.createEtherealAccount();
      }

      return provider;
    }

    case 'console':
    default:
      logger.info('Using Console email provider (emails will be logged, not sent)');
      return new ConsoleProvider();
  }
}
