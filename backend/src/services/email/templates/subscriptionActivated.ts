/**
 * Subscription Activated Email Template
 * Sent when user's subscription is activated after payment
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface SubscriptionActivatedData {
  userName: string;
  email: string;
  planName: string;
  siteName: string;
  amount: string;
  billingPeriod: string;
  nextBillingDate: string;
  dashboardUrl: string;
  manageSubscriptionUrl?: string;
  trialEndsAt?: string;
  platformName?: string;
  supportEmail?: string;
}

export function subscriptionActivatedEmail(data: SubscriptionActivatedData): { subject: string; html: string; text: string } {
  const {
    userName,
    email,
    planName,
    siteName,
    amount,
    billingPeriod,
    nextBillingDate,
    dashboardUrl,
    manageSubscriptionUrl,
    trialEndsAt,
    platformName = 'IntelliConvo',
    supportEmail = 'support@intelliconvo.com',
  } = data;

  const displayName = userName || email.split('@')[0];
  const isTrial = !!trialEndsAt;

  const subject = isTrial
    ? `Your trial has started - ${planName}`
    : `Subscription confirmed - ${planName}`;

  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1f2937;">
      ${isTrial ? 'Your trial has started!' : 'Subscription confirmed!'}
    </h2>

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Hi ${escapeHtml(displayName)},
    </p>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      ${isTrial
        ? `Great news! Your trial for the <strong>${escapeHtml(planName)}</strong> plan has been activated for <strong>${escapeHtml(siteName)}</strong>.`
        : `Thank you for subscribing to the <strong>${escapeHtml(planName)}</strong> plan for <strong>${escapeHtml(siteName)}</strong>.`
      }
    </p>

    <!-- Subscription details box -->
    <div style="margin: 25px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">
        Subscription Details
      </h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Plan</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right; font-weight: 500;">
            ${escapeHtml(planName)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Site</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right; font-weight: 500;">
            ${escapeHtml(siteName)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Amount</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right; font-weight: 500;">
            ${escapeHtml(amount)} / ${escapeHtml(billingPeriod)}
          </td>
        </tr>
        ${isTrial ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Trial ends</td>
          <td style="padding: 8px 0; font-size: 14px; color: #f59e0b; text-align: right; font-weight: 500;">
            ${escapeHtml(trialEndsAt!)}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Next billing date</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right; font-weight: 500;">
            ${escapeHtml(nextBillingDate)}
          </td>
        </tr>
      </table>
    </div>

    ${isTrial ? `
    <div style="padding: 15px; background-color: #dbeafe; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
        <strong>Trial Period:</strong> You have full access to all features during your trial.
        Your card will be charged automatically when the trial ends unless you cancel.
      </p>
    </div>
    ` : ''}

    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      Your AI assistant is now ready to help your website visitors!
    </p>

    ${emailButton('Go to Dashboard', dashboardUrl)}

    ${manageSubscriptionUrl ? `
    <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
      <a href="${escapeHtml(manageSubscriptionUrl)}" style="color: #6366f1; text-decoration: none;">
        Manage your subscription
      </a>
    </p>
    ` : ''}
  `;

  const html = baseLayout({
    title: subject,
    previewText: isTrial
      ? `Your ${planName} trial is active. Full access for ${siteName}.`
      : `Thank you! Your ${planName} subscription is confirmed.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
${isTrial ? 'Your trial has started!' : 'Subscription confirmed!'}

Hi ${displayName},

${isTrial
  ? `Your trial for the ${planName} plan has been activated for ${siteName}.`
  : `Thank you for subscribing to the ${planName} plan for ${siteName}.`
}

Subscription Details:
- Plan: ${planName}
- Site: ${siteName}
- Amount: ${amount} / ${billingPeriod}
${isTrial ? `- Trial ends: ${trialEndsAt}` : ''}
- Next billing: ${nextBillingDate}

Go to your dashboard: ${dashboardUrl}

Best regards,
The ${platformName} Team
`.trim();

  return { subject, html, text };
}
