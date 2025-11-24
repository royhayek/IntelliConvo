/**
 * Email Templates Index
 * Export all email templates
 */

export * from './baseLayout';
export * from './welcome';
export * from './emailVerification';
export * from './passwordReset';
export * from './subscriptionActivated';
export * from './subscriptionCancelled';
export * from './paymentFailed';
export * from './trialExpiring';
export * from './siteReady';
export * from './siteDeleted';
export * from './refundConfirmation';
export * from './disputeAlert';

import { EmailType } from '@prisma/client';
import { welcomeEmail, WelcomeEmailData } from './welcome';
import { emailVerificationEmail, EmailVerificationData } from './emailVerification';
import { passwordResetEmail, PasswordResetData } from './passwordReset';
import { subscriptionActivatedEmail, SubscriptionActivatedData } from './subscriptionActivated';
import { subscriptionCancelledEmail, SubscriptionCancelledData } from './subscriptionCancelled';
import { paymentFailedEmail, PaymentFailedData } from './paymentFailed';
import { trialExpiringEmail, TrialExpiringData } from './trialExpiring';
import { siteReadyEmail, SiteReadyData } from './siteReady';
import { siteDeletedEmail, SiteDeletedData } from './siteDeleted';
import { refundConfirmationEmail, RefundConfirmationData } from './refundConfirmation';
import { disputeAlertEmail, DisputeAlertData } from './disputeAlert';

/**
 * Template data types by email type
 */
export type EmailTemplateData = {
  WELCOME: WelcomeEmailData;
  EMAIL_VERIFICATION: EmailVerificationData;
  PASSWORD_RESET: PasswordResetData;
  SUBSCRIPTION_ACTIVATED: SubscriptionActivatedData;
  SUBSCRIPTION_CANCELLED: SubscriptionCancelledData;
  PAYMENT_FAILED: PaymentFailedData;
  TRIAL_EXPIRING: TrialExpiringData;
  TRIAL_EXPIRED: TrialExpiringData; // Same template with different wording
  PAYMENT_RECEIPT: SubscriptionActivatedData; // Reuse subscription template
  SITE_READY: SiteReadyData;
  SITE_DELETED: SiteDeletedData;
  REFUND_CONFIRMATION: RefundConfirmationData;
  DISPUTE_ALERT: DisputeAlertData;
};

/**
 * Render an email template by type
 */
export function renderEmailTemplate<T extends keyof EmailTemplateData>(
  type: T,
  data: EmailTemplateData[T]
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'WELCOME':
      return welcomeEmail(data as WelcomeEmailData);

    case 'EMAIL_VERIFICATION':
      return emailVerificationEmail(data as EmailVerificationData);

    case 'PASSWORD_RESET':
      return passwordResetEmail(data as PasswordResetData);

    case 'SUBSCRIPTION_ACTIVATED':
    case 'PAYMENT_RECEIPT':
      return subscriptionActivatedEmail(data as SubscriptionActivatedData);

    case 'PAYMENT_FAILED':
      return paymentFailedEmail(data as PaymentFailedData);

    case 'TRIAL_EXPIRING':
    case 'TRIAL_EXPIRED':
      return trialExpiringEmail(data as TrialExpiringData);

    case 'SITE_READY':
      return siteReadyEmail(data as SiteReadyData);

    case 'SUBSCRIPTION_CANCELLED':
      return subscriptionCancelledEmail(data as SubscriptionCancelledData);

    case 'SITE_DELETED':
      return siteDeletedEmail(data as SiteDeletedData);

    case 'REFUND_CONFIRMATION':
      return refundConfirmationEmail(data as RefundConfirmationData);

    case 'DISPUTE_ALERT':
      return disputeAlertEmail(data as DisputeAlertData);

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
