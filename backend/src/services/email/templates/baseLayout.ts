/**
 * Base Email Layout
 * Common HTML structure for all email templates
 */

export interface BaseLayoutData {
  title: string;
  previewText?: string;
  content: string;
  footerText?: string;
  platformName?: string;
  supportEmail?: string;
  primaryColor?: string;
}

export function baseLayout(data: BaseLayoutData): string {
  const {
    title,
    previewText = '',
    content,
    footerText = 'This email was sent automatically. Please do not reply directly.',
    platformName = 'IntelliConvo',
    supportEmail = 'support@intelliconvo.com',
    primaryColor = '#6366f1',
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f4f5;
    }

    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 10px !important;
      }
      .content {
        padding: 20px !important;
      }
      .button {
        width: 100% !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Preview text -->
  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(previewText)}
  </div>

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 10px;">

        <!-- Main container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${primaryColor};">
                ${escapeHtml(platformName)}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #6b7280;">
                ${escapeHtml(footerText)}
              </p>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                Need help? Contact us at
                <a href="mailto:${escapeHtml(supportEmail)}" style="color: ${primaryColor}; text-decoration: none;">
                  ${escapeHtml(supportEmail)}
                </a>
              </p>
              <p style="margin: 15px 0 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} ${escapeHtml(platformName)}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`.trim();
}

/**
 * Generate a styled button for emails
 */
export function emailButton(
  text: string,
  url: string,
  primaryColor = '#6366f1'
): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px auto;">
  <tr>
    <td style="border-radius: 6px; background-color: ${primaryColor};">
      <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Generate a secondary/outline button
 */
export function emailButtonSecondary(
  text: string,
  url: string,
  primaryColor = '#6366f1'
): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 15px auto;">
  <tr>
    <td style="border-radius: 6px; border: 2px solid ${primaryColor};">
      <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: ${primaryColor}; text-decoration: none; border-radius: 6px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
