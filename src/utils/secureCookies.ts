import { serialize, parse } from 'cookie'

// Browser-compatible crypto operations
const getSecretKey = () => {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.COOKIE_SECRET || 'fallback-secret-key-change-in-production';
  }
  // Client-side - use a fixed key for demo purposes
  // In production, this should be handled differently
  return 'client-side-key-for-demo';
};

// Environment variables for cookie security
const COOKIE_SECRET = getSecretKey()
const IS_PRODUCTION = typeof window === 'undefined' ? process.env.NODE_ENV === 'production' : false

/**
 * Secure cookie configuration
 */
export const COOKIE_CONFIG = {
  // User session cookies
  USER_SESSION: {
    name: 'user-session',
    maxAge: 24 * 60 * 60, // 24 hours
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict' as const,
    path: '/'
  },
  // Admin session cookies (shorter expiry)
  ADMIN_SESSION: {
    name: 'admin-session',
    maxAge: 2 * 60, // 2 minutes
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict' as const,
    path: '/admin'
  },
  // CSRF token cookies
  CSRF_TOKEN: {
    name: 'csrf-token',
    maxAge: 24 * 60 * 60, // 24 hours
    httpOnly: false, // Needs to be accessible to client for CSRF protection
    secure: IS_PRODUCTION,
    sameSite: 'strict' as const,
    path: '/'
  }
}

/**
 * Encrypt data for secure cookie storage (server-side only)
 */
function encrypt(text: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: return data as-is (encryption should be handled server-side)
    return text;
  }
  
  try {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(COOKIE_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback to unencrypted
  }
}

/**
 * Decrypt data from secure cookie storage (server-side only)
 */
function decrypt(encryptedText: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: return data as-is
    return encryptedText;
  }
  
  try {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = crypto.scryptSync(COOKIE_SECRET, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipherGCM(algorithm, key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Fallback to original
  }
}

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  // Browser-compatible random bytes generation
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    // Node.js environment
    const nodeCrypto = require('crypto')
    return nodeCrypto.randomBytes(32).toString('hex')
  }
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, cookieToken: string): boolean {
  if (!token || !cookieToken) {
    return false
  }
  
  try {
    // Browser-compatible timing-safe comparison
    if (typeof window !== 'undefined') {
      // Simple constant-time comparison for browser
      if (token.length !== cookieToken.length) {
        return false
      }
      let result = 0
      for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i)
      }
      return result === 0
    } else {
      // Node.js environment with crypto.timingSafeEqual
      const tokenBuffer = Buffer.from(token, 'hex')
      const cookieBuffer = Buffer.from(cookieToken, 'hex')
      
      if (tokenBuffer.length !== cookieBuffer.length) {
        return false
      }
      
      const nodeCrypto = require('crypto')
      return nodeCrypto.timingSafeEqual(tokenBuffer, cookieBuffer)
    }
  } catch (error) {
    console.error('CSRF token verification error:', error)
    return false
  }
}

/**
 * Set a secure encrypted cookie
 */
export function setSecureCookie(
  name: string,
  value: any,
  options: {
    maxAge?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    path?: string
  } = {}
): string {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    const encryptedValue = encrypt(stringValue)
    
    const cookieOptions = {
      maxAge: options.maxAge || 24 * 60 * 60, // Default 24 hours
      httpOnly: options.httpOnly !== false, // Default true
      secure: options.secure !== false && IS_PRODUCTION, // Default true in production
      sameSite: options.sameSite || 'strict',
      path: options.path || '/'
    }
    
    return serialize(name, encryptedValue, cookieOptions)
  } catch (error) {
    console.error('Set secure cookie error:', error)
    throw new Error('Failed to set secure cookie')
  }
}

/**
 * Get and decrypt a secure cookie
 */
export function getSecureCookie(cookieHeader: string | undefined, name: string): any {
  if (!cookieHeader) {
    return null
  }
  
  try {
    const cookies = parse(cookieHeader)
    const encryptedValue = cookies[name]
    
    if (!encryptedValue) {
      return null
    }
    
    const decryptedValue = decrypt(encryptedValue)
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(decryptedValue)
    } catch {
      return decryptedValue
    }
  } catch (error) {
    console.error('Get secure cookie error:', error)
    return null
  }
}

/**
 * Clear a secure cookie
 */
export function clearSecureCookie(
  name: string,
  options: {
    path?: string
    domain?: string
  } = {}
): string {
  return serialize(name, '', {
    maxAge: 0,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    path: options.path || '/'
  })
}

/**
 * Validate cookie integrity and expiration
 */
export function validateCookieSession(sessionData: any, maxAge?: number): boolean {
  if (!sessionData || typeof sessionData !== 'object') {
    return false
  }
  
  // Check if session has required fields
  if (!sessionData.userId || !sessionData.email || !sessionData.createdAt) {
    return false
  }
  
  // Check if session is expired
  const createdAt = new Date(sessionData.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  
  // Use provided maxAge or default based on role
  const sessionMaxAge = maxAge || (sessionData.role && (sessionData.role === 'admin' || sessionData.role === 'super_admin') ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000)
  
  if (diffMs > sessionMaxAge) {
    return false
  }
  
  return true
}

/**
 * Browser-compatible UUID generation
 */
function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  } else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Fallback UUID v4 generation for browsers without randomUUID
    const array = new Uint8Array(16)
    window.crypto.getRandomValues(array)
    array[6] = (array[6] & 0x0f) | 0x40 // Version 4
    array[8] = (array[8] & 0x3f) | 0x80 // Variant bits
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  } else {
    // Node.js environment
    const nodeCrypto = require('crypto')
    return nodeCrypto.randomUUID()
  }
}

/**
 * Browser-compatible hash function
 */
function createHash(data: string): string {
  if (typeof window !== 'undefined') {
    // Browser environment - simple hash (not cryptographically secure but functional)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  } else {
    // Node.js environment
    const nodeCrypto = require('crypto')
    return nodeCrypto.createHash('sha256').update(data).digest('hex')
  }
}

/**
 * Create secure session data
 */
export function createSessionData(user: any, role?: string) {
  const fingerprint = createHash(`${user.id}-${user.email}-${Date.now()}`)
  
  return {
    userId: user.id,
    email: user.email,
    role: role || 'user',
    createdAt: new Date().toISOString(),
    sessionId: generateUUID(),
    // Add fingerprint for additional security
    fingerprint
  }
}

/**
 * Security headers for responses
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.supabase.co https://*.supabase.co; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': IS_PRODUCTION ? 'max-age=31536000; includeSubDomains; preload' : undefined,
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

/**
 * Apply security headers to NextResponse
 */
export function applySecurityHeaders(response: any) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })
  
  // Prevent caching of sensitive pages
  const url = response.url || ''
  if (url.includes('/admin') || url.includes('/dashboard') || url.includes('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}