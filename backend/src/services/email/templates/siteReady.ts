/**
 * Site Ready Email Template
 * Sent when AI assistant setup is complete
 */

import { baseLayout, emailButton, emailButtonSecondary, escapeHtml } from './baseLayout';

export interface SiteReadyData {
  userName: string;
  email: string;
  siteName: string;
  siteUrl: string;
  pagesIndexed: number;
  dashboardUrl: string;
  widgetInstallUrl?: string;
  platformName?: string;
  supportEmail?: string;
}

export function siteReadyEmail(data: SiteReadyData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    siteName,
    siteUrl,
    pagesIndexed,
    dashboardUrl,
    widgetInstallUrl,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Your AI assistant for ${siteName} is ready!`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #059669;">
      Your AI assistant is ready!
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Great news! Your AI assistant for <strong>${escapeHtml(siteName)}</strong> has finished learning
      from your website and is ready to help your visitors.
    </p>

    <!-- Stats box -->
    <div style="margin: 25px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; text-align: center;">
      <div style="font-size: 36px; font-weight: 700; color: #059669; margin-bottom: 5px;">
        ${pagesIndexed}
      </div>
      <div style="font-size: 14px; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">
        Pages Indexed
      </div>
      <p style="margin: 15px 0 0; font-size: 14px; color: #065f46;">
        from ${escapeHtml(siteUrl)}
      </p>
    </div>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Your assistant can now answer questions about your website content,
      products, services, and more!
    </p>

    <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">
      What's next?
    </h3>

    <ol style="margin: 0 0 25px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #4b5563;">
      <li>Test your assistant in the dashboard</li>
      <li>Customize the chat widget appearance</li>
      <li>Add the widget to your website</li>
      <li>Watch the conversations roll in!</li>
    </ol>

    ${emailButton('View Dashboard', dashboardUrl, '#059669')}

    ${widgetInstallUrl ? `
    <p style="margin: 20px 0 0; text-align: center;">
      ${emailButtonSecondary('Get Widget Code', widgetInstallUrl, '#059669')}
    </p>
    ` : ''}

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Need to add more pages or upload documents? You can do that anytime from your dashboard.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Your AI assistant is ready! ${pagesIndexed} pages indexed from ${siteName}.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Your AI assistant is ready!

Hi ${displayName},

Great news! Your AI assistant for ${siteName} has finished learning from your website.

${pagesIndexed} pages indexed from ${siteUrl}

What's next?
1. Test your assistant in the dashboard
2. Customize the chat widget appearance
3. Add the widget to your website
4. Watch the conversations roll in!

View your dashboard: ${dashboardUrl}

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
