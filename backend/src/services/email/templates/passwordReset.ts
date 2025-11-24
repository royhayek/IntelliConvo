/**
 * Password Reset Email Template
 * Sent when user requests a password reset
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface PasswordResetData {
  userName: string;
  email: string;
  resetUrl: string;
  expiresInMinutes?: number;
  platformName?: string;
  supportEmail?: string;
}

export function passwordResetEmail(data: PasswordResetData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    resetUrl,
    expiresInMinutes = 60,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];

  const subject = `Reset your password`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      Reset your password
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      We received a request to reset the password for your ${escapeHtml(platformName)} account.
      Click the button below to create a new password:
    </p>

    ${emailButton('Reset Password', resetUrl)}

    <p style="margin: 25px 0 15px; font-size: 14px; line-height: 1.6; color: #6b7280;">
      This link will expire in <strong>${expiresInMinutes} minutes</strong> for security reasons.
    </p>

    <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>

    <p style="margin: 0 0 25px; font-size: 12px; line-height: 1.6; color: #9ca3af; word-break: break-all;">
      <a href="${escapeHtml(resetUrl)}" style="color: #6366f1; text-decoration: none;">
        ${escapeHtml(resetUrl)}
      </a>
    </p>

    <div style="padding: 15px; background-color: #fee2e2; border-radius: 6px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
        <strong>Didn't request this?</strong><br>
        If you didn't request a password reset, please ignore this email or contact support
        if you believe your account may be compromised.
      </p>
    </div>

    <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      For security tips, we recommend:
    </p>
    <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #6b7280;">
      <li>Use a unique password you don't use elsewhere</li>
      <li>Include a mix of letters, numbers, and symbols</li>
      <li>Make it at least 12 characters long</li>
    </ul>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `Reset your ${platformName} password. This link expires in ${expiresInMinutes} minutes.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
Reset your password

Hi ${displayName},

We received a request to reset the password for your ${platformName} account.

Click here to reset your password: ${resetUrl}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request this, please ignore this email or contact support.

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
