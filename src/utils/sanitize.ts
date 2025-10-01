import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - The HTML content to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(content: string, options?: any): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Default configuration for safe HTML
  const defaultConfig: any = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'src', 'alt', 'title', 'width', 'height',
      'href', 'target', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ...options
  };

  const sanitized = DOMPurify.sanitize(content, defaultConfig);
  return typeof sanitized === 'string' ? sanitized : sanitized.toString();
}

/**
 * Sanitizes plain text content by escaping HTML entities
 * @param content - The text content to sanitize
 * @returns Escaped text string
 */
export function sanitizeText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes content for safe rendering in React components
 * @param content - The content to sanitize
 * @param allowHtml - Whether to allow HTML tags (default: false)
 * @returns Sanitized content object for dangerouslySetInnerHTML or plain text
 */
export function sanitizeForReact(content: string, allowHtml: boolean = false): { __html: string } | string {
  if (!content || typeof content !== 'string') {
    return allowHtml ? { __html: '' } : '';
  }

  if (allowHtml) {
    return { __html: sanitizeHtml(content) };
  }

  return sanitizeText(content);
}

/**
 * Validates and sanitizes JSON content that may contain user input
 * @param jsonContent - JSON object that may contain user-generated content
 * @returns Sanitized JSON object
 */
export function sanitizeJsonContent(jsonContent: any): any {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return jsonContent;
  }

  if (Array.isArray(jsonContent)) {
    return jsonContent.map(item => sanitizeJsonContent(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(jsonContent)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeJsonContent(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Creates a safe HTML object for React's dangerouslySetInnerHTML
 * @param content - The HTML content to sanitize
 * @returns Object with __html property containing sanitized HTML
 */
export function createSafeHTML(content: string): { __html: string } {
  if (!content || typeof content !== 'string') {
    return { __html: '' };
  }

  return { __html: sanitizeHtml(content) };
}