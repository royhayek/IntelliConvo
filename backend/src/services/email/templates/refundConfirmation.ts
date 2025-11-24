/**
 * Refund Confirmation Email Template
 * Sent when a payment has been refunded
 */

import { baseLayout, escapeHtml } from './baseLayout';

export interface RefundConfirmationData {
  userName: string;
  email: string;
  siteName: string;
  amount: string;
  refundDate: string;
  reason?: string;
  transactionId?: string;
  platformName?: string;
  supportEmail?: string;
}

export function refundConfirmationEmail(data: RefundConfirmationData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    siteName,
    amount,
    refundDate,
    reason,
    transactionId,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Refund Processed - ${amount}`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Your refund has been processed
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      We've processed a refund for your ${escapeHtml(siteName)} subscription. Here are the details:
    </p>

    <div style="margin: 25px 0; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Amount Refunded:</td>
          <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-align: right;">${escapeHtml(amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Refund Date:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">${escapeHtml(refundDate)}</td>
        </tr>
        ${transactionId ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Transaction ID:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">${escapeHtml(transactionId)}</td>
        </tr>
        ` : ''}
        ${reason ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Reason:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">${escapeHtml(reason)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      The refund will appear on your original payment method within 5-10 business days,
      depending on your bank or card issuer.
    </p>

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you have any questions about this refund, please contact us at
      <a href="mailto:${supportEmail}" style="color: #4f46e5; text-decoration: none;">${supportEmail}</a>.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Your refund of ${amount} has been processed for ${siteName}.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Your refund has been processed

Hi ${displayName},

We've processed a refund for your ${siteName} subscription.

Amount Refunded: ${amount}
Refund Date: ${refundDate}
${transactionId ? `Transaction ID: ${transactionId}` : ''}
${reason ? `Reason: ${reason}` : ''}

The refund will appear on your original payment method within 5-10 business days.

Questions? Contact us at ${supportEmail}.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
