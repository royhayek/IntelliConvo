import { WidgetSettings } from '../types';

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function sanitizeHtmlWithConfig(html: string, settings: WidgetSettings | null): string {
  if (!settings?.sanitizeHtml) {
    return html;
  }

  const allowedTags = settings.allowedHtmlTags || ['b', 'i', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'];

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const sanitize = (element: Element): string => {
    let result = '';

    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        if (allowedTags.includes(tagName)) {
          let attrs = '';
          if (tagName === 'a' && el.getAttribute('href')) {
            const href = el.getAttribute('href');
            if (href?.startsWith('http://') || href?.startsWith('https://')) {
              attrs = ` href="${href}" target="_blank" rel="noopener noreferrer"`;
            }
          }

          result += `<${tagName}${attrs}>${sanitize(el)}</${tagName}>`;
        } else {
          result += sanitize(el);
        }
      }
    });

    return result;
  };

  return sanitize(temp);
}

/**
 * Converts basic markdown syntax to HTML
 * Supports: bold, italic, code, links, line breaks, lists
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML tags first to prevent XSS
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // Code blocks (```code```)
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold (** or __)
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic (* or _)
  html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Line breaks (two spaces + newline or double newline)
  html = html.replace(/  \n/g, '<br>');
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');

  // Unordered lists
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  return html;
}
