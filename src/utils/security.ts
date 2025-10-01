/**
 * Security configuration and Content Security Policy setup
 * Helps prevent XSS attacks and other security vulnerabilities
 */

/**
 * Content Security Policy configuration
 * This should be implemented at the server level (e.g., in Vite config or Express middleware)
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev mode
    "'unsafe-eval'", // Required for development
    'https://js.stripe.com',
    'https://checkout.stripe.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://trae-api-sg.mchost.guru' // For generated images
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'wss://localhost:*', // For Vite HMR
    'ws://localhost:*' // For Vite HMR
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com'
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"]
}

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

/**
 * Input validation helpers
 */
export function validateInput(input: string, maxLength: number = 10000): boolean {
  if (!input || typeof input !== 'string') return false
  if (input.length > maxLength) return false
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  API_CALLS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  AUTH_ATTEMPTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 auth attempts per windowMs
  },
  DRAFT_GENERATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // limit each user to 10 draft generations per hour
  }
}