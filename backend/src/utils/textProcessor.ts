import * as cheerio from 'cheerio';

/**
 * Convert HTML content to clean plain text
 * Strips all HTML tags and normalizes whitespace
 */
export function htmlToText(html: string): string {
  if (!html || html.trim() === '') {
    return '';
  }

  try {
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style').remove();

    // Get text content
    const text = $('body').text() || $.text();

    // Normalize whitespace
    return text
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    // Fallback: simple regex-based HTML stripping
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
