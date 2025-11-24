/**
 * Dispute Alert Email Template
 * Sent to admins when a chargeback/dispute is opened
 * This is a CRITICAL notification that requires immediate attention
 */

import { baseLayout, emailButton, escapeHtml } from './baseLayout';

export interface DisputeAlertData {
  disputeId: string;
  chargeId: string;
  amount: string;
  currency: string;
  reason: string;
  customerEmail: string;
  customerName?: string;
  siteName: string;
  siteId: string;
  userId: string;
  createdAt: string;
  respondByDate?: string;
  stripeDisputeUrl: string;
  platformName?: string;
  supportEmail?: string;
}

export function disputeAlertEmail(data: DisputeAlertData): { subject: string; html: string; text: string } {
  const {
    disputeId,
    chargeId,
    amount,
    currency,
    reason,
    customerEmail,
    customerName,
    siteName,
    siteId,
    userId,
    createdAt,
    respondByDate,
    stripeDisputeUrl,
    platformName = 'IntelligentConvo',
    supportEmail = 'support@intelligentconvo.com',
  } = data;

  const subject = `🚨 URGENT: Dispute Opened - ${amount} ${currency}`;

  const content = `
    <div style="margin: 0 0 20px; padding: 15px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #991b1b;">
        ⚠️ Action Required: Payment Dispute Opened
      </h2>
    </div>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4b5563;">
      A customer has opened a dispute (chargeback) for a payment. This requires your immediate attention
      to prevent revenue loss and potential account penalties.
    </p>

    <div style="margin: 25px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Dispute Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 40%;">Amount:</td>
          <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #dc2626;">${escapeHtml(amount)} ${escapeHtml(currency)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Dispute Reason:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937;">${escapeHtml(reason)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Dispute ID:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-family: monospace;">${escapeHtml(disputeId)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Charge ID:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-family: monospace;">${escapeHtml(chargeId)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Created:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937;">${escapeHtml(createdAt)}</td>
        </tr>
        ${respondByDate ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Respond By:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #dc2626;">${escapeHtml(respondByDate)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="margin: 25px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Customer Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 40%;">Email:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937;">${escapeHtml(customerEmail)}</td>
        </tr>
        ${customerName ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Name:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937;">${escapeHtml(customerName)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Site:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937;">${escapeHtml(siteName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">User ID:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-family: monospace;">${escapeHtml(userId)}</td>
        </tr>
      </table>
    </div>

    ${emailButton('View Dispute in Stripe', stripeDisputeUrl)}

    <div style="margin: 25px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
      <h4 style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #92400e;">Recommended Actions:</h4>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #78350f;">
        <li>Review the dispute in Stripe Dashboard immediately</li>
        <li>Gather evidence (subscription records, login history, email communications)</li>
        <li>Consider reaching out to the customer to resolve directly</li>
        <li>Submit your response before the deadline</li>
        <li>Consider pausing or cancelling the customer's subscription</li>
      </ol>
    </div>

    <p style="margin: 25px 0 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
      This is an automated alert from ${escapeHtml(platformName)} billing system.
      Disputes can result in fees and affect your Stripe account standing if not addressed promptly.
    </p>
  `;

  const html = baseLayout({
    title: subject,
    previewText: `URGENT: A ${amount} ${currency} dispute has been opened. Respond before the deadline.`,
    content,
    platformName,
    supportEmail,
  });

  const text = `
🚨 URGENT: Payment Dispute Opened

A customer has opened a dispute (chargeback) requiring immediate attention.

DISPUTE DETAILS
---------------
Amount: ${amount} ${currency}
Reason: ${reason}
Dispute ID: ${disputeId}
Charge ID: ${chargeId}
Created: ${createdAt}
${respondByDate ? `Respond By: ${respondByDate}` : ''}

CUSTOMER INFORMATION
--------------------
Email: ${customerEmail}
${customerName ? `Name: ${customerName}` : ''}
Site: ${siteName}
User ID: ${userId}

ACTION REQUIRED
---------------
1. Review the dispute in Stripe Dashboard: ${stripeDisputeUrl}
2. Gather evidence (subscription records, login history, emails)
3. Consider reaching out to the customer
4. Submit your response before the deadline
5. Consider pausing the customer's subscription

This dispute can result in fees and affect your Stripe account if not addressed.

---
Automated alert from ${platformName}
`.trim();

  return { subject, html, text };
}
