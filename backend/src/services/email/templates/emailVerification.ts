/**
 * Email Verification Template
 * Sent to verify user's email address
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface EmailVerificationData {
  userName: string;
  email: string;
  verificationUrl: string;
  expiresInHours?: number;
  platformName?: string;
  supportEmail?: string;
}

export function emailVerificationEmail(data: EmailVerificationData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    verificationUrl,
    expiresInHours = 24,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Verify your email address`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Verify your email address
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Please verify your email address to complete your ${escapeHtml(platformName)} account setup.
      Click the button below to confirm your email:
    </p>

    ${emailButton('Verify Email Address', verificationUrl)}

    <p style="margin: 25px 0 15px; font-size: 14px; line-height: 1.6; color: #6b7280;">
      This link will expire in <strong>${expiresInHours} hours</strong>.
    </p>

    <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>

    <p style="margin: 0 0 25px; font-size: 12px; line-height: 1.6; color: #9ca3af; word-break: break-all;">
      <a href="${escapeHtml(verificationUrl)}" style="color: #6366f1; text-decoration: none;">
        ${escapeHtml(verificationUrl)}
      </a>
    </p>

    <div style="padding: 15px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">
        <strong>Didn't create an account?</strong><br>
        If you didn't sign up for ${escapeHtml(platformName)}, you can safely ignore this email.
      </p>
    </div>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Verify your email to complete your ${platformName} registration.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Verify your email address

Hi ${displayName},

Please verify your email address to complete your ${platformName} account setup.

Click here to verify: ${verificationUrl}

This link will expire in ${expiresInHours} hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
