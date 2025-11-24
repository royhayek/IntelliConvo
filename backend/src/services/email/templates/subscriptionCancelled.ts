/**
 * Subscription Cancelled Email Template
 * Sent when a user's subscription is cancelled
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface SubscriptionCancelledData {
  userName: string;
  email: string;
  siteName: string;
  planName: string;
  accessEndsAt: string; // Date when access ends (end of billing period)
  resubscribeUrl: string;
  platformName?: string;
  supportEmail?: string;
}

export function subscriptionCancelledEmail(data: SubscriptionCancelledData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    siteName,
    planName,
    accessEndsAt,
    resubscribeUrl,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Your ${planName} subscription has been cancelled`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Subscription Cancelled
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      We've processed your cancellation request for your <strong>${escapeHtml(planName)}</strong> subscription
      for <strong>${escapeHtml(siteName)}</strong>.
    </p>

    <div style="margin: 20px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
        <strong>What happens next:</strong>
      </p>
      <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #4b5563;">
        <li>Your assistant will continue working until <strong>${escapeHtml(accessEndsAt)}</strong></li>
        <li>After that date, your assistant will stop responding to visitors</li>
        <li>Your data will be preserved for 30 days in case you change your mind</li>
      </ul>
    </div>

    <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      We're sorry to see you go! If you change your mind, you can resubscribe at any time to reactivate your assistant.
    </p>

    ${emailButton('Resubscribe', resubscribeUrl)}

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you have any feedback about why you cancelled or how we can improve, we'd love to hear from you.
      Just reply to this email.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Your ${planName} subscription for ${siteName} has been cancelled. Access ends ${accessEndsAt}.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Subscription Cancelled

Hi ${displayName},

We've processed your cancellation request for your ${planName} subscription for ${siteName}.

What happens next:
- Your assistant will continue working until ${accessEndsAt}
- After that date, your assistant will stop responding to visitors
- Your data will be preserved for 30 days in case you change your mind

We're sorry to see you go! If you change your mind, you can resubscribe at any time:
${resubscribeUrl}

If you have any feedback about why you cancelled, just reply to this email.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
