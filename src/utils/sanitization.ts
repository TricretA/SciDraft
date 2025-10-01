/**
 * Input sanitization utilities for SciDraft
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitizes text input by removing potentially harmful characters
 * while preserving scientific notation and common symbols
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove potentially harmful HTML tags but keep basic formatting
    .replace(/<(?!\/?(?:b|i|u|em|strong|sup|sub|br)\b)[^>]*>/gi, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Limit length to prevent DoS
    .slice(0, 50000)
    .trim();
};

/**
 * Sanitizes file names to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') return 'unnamed_file';
  
  return fileName
    // Remove path separators
    .replace(/[\/\\]/g, '')
    // Remove potentially harmful characters
    .replace(/[<>:"|?*]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Limit length
    .slice(0, 255)
    .trim() || 'unnamed_file';
};

/**
 * Sanitizes numeric input
 */
export const sanitizeNumber = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Only allow digits, decimal points, minus signs, and scientific notation
  return input.replace(/[^0-9.\-eE+]/g, '').slice(0, 20);
};

/**
 * Sanitizes HTML content for display (escapes HTML entities)
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Validates and sanitizes email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim().slice(0, 254);
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitizes URLs to prevent malicious redirects
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitizes JSON strings to prevent injection
 */
export const sanitizeJsonString = (jsonString: string): string => {
  if (!jsonString || typeof jsonString !== 'string') return '{}';
  
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch {
    return '{}';
  }
};

/**
 * Rate limiting helper for API calls
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
};