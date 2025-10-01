/**
 * Input Sanitization Utilities
 * Provides comprehensive sanitization for all user inputs before backend/AI processing
 */

// HTML entities for XSS protection
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return ''
  return text.replace(/[&<>"'\/]/g, (match) => HTML_ENTITIES[match] || match)
}

/**
 * Sanitize text input by removing dangerous characters and limiting length
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') return ''
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  // Remove dangerous characters, keep only valid email characters
  const sanitized = email
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]/g, '')
    .trim()
  
  // Limit length
  return sanitized.length > 254 ? sanitized.substring(0, 254) : sanitized
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number, min?: number, max?: number): number | null {
  let num: number
  
  if (typeof input === 'string') {
    // Remove non-numeric characters except decimal point and minus
    const cleaned = input.replace(/[^0-9.-]/g, '')
    num = parseFloat(cleaned)
  } else {
    num = input
  }
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return null
  }
  
  // Apply min/max constraints
  if (min !== undefined && num < min) return min
  if (max !== undefined && num > max) return max
  
  return num
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return 'untitled'
  
  // Remove path traversal attempts and dangerous characters
  let sanitized = filename
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\.\.+/g, '_')
    .replace(/^[.\s]+|[.\s]+$/g, '')
  
  // Ensure not empty
  if (!sanitized) sanitized = 'untitled'
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.lastIndexOf('.')
    if (ext > 0) {
      const name = sanitized.substring(0, ext)
      const extension = sanitized.substring(ext)
      sanitized = name.substring(0, 255 - extension.length) + extension
    } else {
      sanitized = sanitized.substring(0, 255)
    }
  }
  
  return sanitized
}

/**
 * Sanitize search query input
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return ''
  
  // Remove dangerous characters but keep spaces and basic punctuation
  let sanitized = query
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>"'&]/g, '')
    .trim()
  
  // Limit length
  return sanitized.length > 200 ? sanitized.substring(0, 200) : sanitized
}

/**
 * Sanitize JSON data recursively
 */
export function sanitizeJsonData(data: any, maxDepth: number = 10): any {
  if (maxDepth <= 0) return null
  
  if (typeof data === 'string') {
    return sanitizeText(data)
  }
  
  if (typeof data === 'number') {
    return isFinite(data) ? data : null
  }
  
  if (typeof data === 'boolean' || data === null) {
    return data
  }
  
  if (Array.isArray(data)) {
    return data
      .slice(0, 1000) // Limit array size
      .map(item => sanitizeJsonData(item, maxDepth - 1))
      .filter(item => item !== null)
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {}
    let keyCount = 0
    
    for (const [key, value] of Object.entries(data)) {
      if (keyCount >= 100) break // Limit object size
      
      const sanitizedKey = sanitizeText(key, 100)
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeJsonData(value, maxDepth - 1)
        keyCount++
      }
    }
    
    return sanitized
  }
  
  return null
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(formData)) {
    const sanitizedKey = sanitizeText(key, 50)
    if (!sanitizedKey) continue
    
    if (typeof value === 'string') {
      // Special handling for different field types
      if (key.toLowerCase().includes('email')) {
        sanitized[sanitizedKey] = sanitizeEmail(value)
      } else if (key.toLowerCase().includes('phone')) {
        sanitized[sanitizedKey] = value.replace(/[^0-9+\-\s()]/g, '').trim()
      } else {
        sanitized[sanitizedKey] = sanitizeText(value)
      }
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value)
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value
    } else if (value === null || value === undefined) {
      sanitized[sanitizedKey] = null
    } else {
      // For complex objects, use JSON sanitization
      sanitized[sanitizedKey] = sanitizeJsonData(value)
    }
  }
  
  return sanitized
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export function validateAndSanitizeFile(
  file: File,
  options: FileValidationOptions = {}
): { isValid: boolean; error?: string; sanitizedName?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'],
    allowedExtensions = ['.pdf', '.txt', '.jpg', '.jpeg', '.png']
  } = options
  
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
    }
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not allowed'
    }
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: 'File extension not allowed'
    }
  }
  
  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name)
  
  return {
    isValid: true,
    sanitizedName
  }
}

/**
 * Rate limiting helper for input validation
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = identifier
  
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  
  if (current.count >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }
  
  current.count++
  return { allowed: true, remaining: maxAttempts - current.count }
}

/**
 * Clean up rate limit map periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 300000) // Clean up every 5 minutes