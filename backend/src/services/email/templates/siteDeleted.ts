/**
 * Site Deleted Email Template
 * Sent when a user deletes their site/assistant
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface SiteDeletedData {
  userName: string;
  email: string;
  siteName: string;
  siteUrl: string;
  createNewUrl: string;
  platformName?: string;
  supportEmail?: string;
}

export function siteDeletedEmail(data: SiteDeletedData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    siteName,
    siteUrl,
    createNewUrl,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Your assistant "${siteName}" has been deleted`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Assistant Deleted
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Your AI assistant <strong>"${escapeHtml(siteName)}"</strong> for
      <span style="color: #6366f1;">${escapeHtml(siteUrl)}</span> has been permanently deleted.
    </p>

    <div style="margin: 20px 0; padding: 20px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
        <strong>Please note:</strong> All conversation history, crawled pages, and embeddings have been removed.
        The widget will no longer work on your website. If you had a subscription for this site, it has been cancelled.
      </p>
    </div>

    <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Want to create another assistant? You can set up a new one anytime.
    </p>

    ${emailButton('Create New Assistant', createNewUrl)}

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you didn't delete this assistant or believe this was a mistake, please contact our support team immediately.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Your assistant "${siteName}" for ${siteUrl} has been deleted.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Assistant Deleted

Hi ${displayName},

Your AI assistant "${siteName}" for ${siteUrl} has been permanently deleted.

Please note: All conversation history, crawled pages, and embeddings have been removed.
The widget will no longer work on your website. If you had a subscription for this site, it has been cancelled.

Want to create another assistant? Visit: ${createNewUrl}

If you didn't delete this assistant or believe this was a mistake, please contact our support team.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
