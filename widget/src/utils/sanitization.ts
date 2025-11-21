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
