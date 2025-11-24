/**
 * Trial Expiring Email Template
 * Sent a few days before trial ends
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface TrialExpiringData {
  userName: string;
  email: string;
  siteName: string;
  planName: string;
  daysRemaining: number;
  expiresAt: string;
  upgradeUrl: string;
  platformName?: string;
  supportEmail?: string;
}

export function trialExpiringEmail(data: TrialExpiringData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    siteName,
    planName,
    daysRemaining,
    expiresAt,
    upgradeUrl,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];
  const urgencyText = daysRemaining <= 1 ? 'tomorrow' : `in ${daysRemaining} days`;

  const subject = `Your trial ends ${urgencyText} - ${siteName}`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Your trial ends ${urgencyText}
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Your ${escapeHtml(planName)} trial for <strong>${escapeHtml(siteName)}</strong>
      will expire on <strong>${escapeHtml(expiresAt)}</strong>.
    </p>

    <div style="margin: 25px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #92400e;">
        <strong>Don't lose access!</strong><br>
        After your trial ends, your AI assistant will stop responding to visitors.
        Continue using ${escapeHtml(platformName)} without interruption by upgrading now.
      </p>
    </div>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Here's what you'll keep with your subscription:
    </p>

    <ul style="margin: 0 0 25px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #4b5563;">
      <li>Your trained AI assistant and all knowledge</li>
      <li>Conversation history and analytics</li>
      <li>Custom widget settings and branding</li>
      <li>Unlimited conversations with your visitors</li>
    </ul>

    ${emailButton('Continue Your Subscription', upgradeUrl)}

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Have questions? Reply to this email or contact our support team.
      We're here to help you get the most out of ${escapeHtml(platformName)}.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Your ${planName} trial for ${siteName} expires ${urgencyText}. Don't lose your AI assistant!`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Your trial ends ${urgencyText}

Hi ${displayName},

Your ${planName} trial for ${siteName} will expire on ${expiresAt}.

Don't lose access to your AI assistant! Upgrade now to continue:
${upgradeUrl}

What you'll keep:
- Your trained AI assistant and all knowledge
- Conversation history and analytics
- Custom widget settings and branding
- Unlimited conversations with your visitors

Questions? Contact us at ${supportEmail}.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
