/**
 * Welcome Email Template
 * Sent when a new user registers
 * Optionally includes email verification link
 */

import { baseLayout, emailButton, emailButtonSecondary, escapeHtml } from './baseLayout';

export interface WelcomeEmailData {
  userName: string;
  email: string;
  loginUrl: string;
  verificationUrl?: string; // Optional: Include to prompt email verification
  verificationExpiresInHours?: number; // Defaults to 24 hours
  platformName?: string;
  supportEmail?: string;
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    loginUrl,
    verificationUrl,
    verificationExpiresInHours = 24,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];
  const needsVerification = !!verificationUrl;

  const subject = needsVerification
    ? `Welcome to ${platformName}! Please verify your email`
    : `Welcome to ${platformName}!`;

  // Email verification section (shown only if verification is needed)
  const verificationSection = needsVerification ? `
    <div style="margin: 0 0 25px; padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #92400e;">
        Verify your email address
      </h3>
      <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #92400e;">
        To get full access to your account, please verify your email address by clicking the button below.
        This link will expire in <strong>${verificationExpiresInHours} hours</strong>.
      </p>
      ${emailButton('Verify Email Address', verificationUrl)}
    </div>
  ` : '';

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Welcome, ${escapeHtml(displayName)}!
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Thank you for joining ${escapeHtml(platformName)}! We're excited to have you on board.
    </p>

    ${verificationSection}

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      With ${escapeHtml(platformName)}, you can create AI-powered chatbots for your website in minutes.
      Our intelligent assistants learn from your content to provide accurate, helpful responses to your visitors.
    </p>

    <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Here's what you can do next:
    </p>

    <ul style="margin: 0 0 25px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #4b5563;">
      <li>Create your first AI assistant</li>
      <li>Add your website URL to train the chatbot</li>
      <li>Customize the widget to match your brand</li>
      <li>Embed the widget on your website</li>
    </ul>

    ${emailButtonSecondary('Get Started', loginUrl)}

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you have any questions, don't hesitate to reach out to our support team.
      We're here to help you succeed!
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: needsVerification
      ? `Welcome to ${platformName}! Please verify your email to get started.`
      : `Welcome to ${platformName}! Get started with your AI chatbot.`,
    content,
    platformName,
    supportEmail,
  });

  // Build text version
  let text = `
Welcome, ${displayName}!

Thank you for joining ${platformName}! We're excited to have you on board.
`.trim();

  if (needsVerification) {
    text += `

---
VERIFY YOUR EMAIL ADDRESS
---
To get full access to your account, please verify your email address.
This link will expire in ${verificationExpiresInHours} hours.

Verify here: ${verificationUrl}
`;
  }

  text += `

With ${platformName}, you can create AI-powered chatbots for your website in minutes.

Get started: ${loginUrl}

If you have any questions, reach out to us at ${supportEmail}.

Best regards,
The ${platformName} Team
`;

  return { subject, html, text: text.trim() };
}
