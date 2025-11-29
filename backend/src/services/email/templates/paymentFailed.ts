/**
 * Payment Failed Email Template
 * Sent when a subscription payment fails
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface PaymentFailedData {
  userName: string;
  email: string;
  siteName: string;
  amount: string;
  failureReason?: string;
  updatePaymentUrl: string;
  retryDate?: string;
  platformName?: string;
  supportEmail?: string;
}

export function paymentFailedEmail(data: PaymentFailedData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    siteName,
    amount,
    failureReason,
    updatePaymentUrl,
    retryDate,
    platformName = 'IntelliConvo',
    supportEmail = 'support@intelliconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Action required: Payment failed for ${siteName}`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #dc2626;">
      Payment failed
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      We were unable to process your payment of <strong>${escapeHtml(amount)}</strong> for
      <strong>${escapeHtml(siteName)}</strong>.
    </p>

    ${failureReason ? `
    <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-radius: 6px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
        <strong>Reason:</strong> ${escapeHtml(failureReason)}
      </p>
    </div>
    ` : ''}

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      To continue using your AI assistant without interruption, please update your payment method:
    </p>

    ${emailButton('Update Payment Method', updatePaymentUrl, '#dc2626')}

    ${retryDate ? `
    <p style="margin: 20px 0 15px; font-size: 14px; line-height: 1.6; color: #6b7280;">
      We'll automatically retry the payment on <strong>${escapeHtml(retryDate)}</strong>.
      Please update your payment details before then to avoid service interruption.
    </p>
    ` : ''}

    <div style="margin: 25px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
      <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #92400e;">
        What happens next?
      </h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #92400e;">
        <li>Your AI assistant will continue working during the grace period</li>
        <li>If payment isn't resolved, your subscription will be paused</li>
        <li>You won't lose any data - just update your payment to resume</li>
      </ul>
    </div>

    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you believe this is an error or need assistance, please contact our support team.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Your payment of ${amount} for ${siteName} couldn't be processed. Please update your payment method.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Payment failed

Hi ${displayName},

We were unable to process your payment of ${amount} for ${siteName}.

${failureReason ? `Reason: ${failureReason}` : ''}

Please update your payment method: ${updatePaymentUrl}

${retryDate ? `We'll retry the payment on ${retryDate}.` : ''}

If you need assistance, contact us at ${supportEmail}.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
