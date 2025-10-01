import { createServerClient } from '@supabase/ssr'
import { Request, Response } from 'express'

/**
 * Validates user session server-side
 * Checks if user is authenticated and email is confirmed
 */
export async function validateUserSession(req: Request, res: Response) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`)
          },
          remove(name: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`)
          },
        },
      }
    )
    
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session || !session.user) {
      return {
        isValid: false,
        error: 'No valid session found',
        user: null
      }
    }

    // Check if email is confirmed
    if (!session.user.email_confirmed_at) {
      return {
        isValid: false,
        error: 'Email not confirmed',
        user: null
      }
    }

    return {
      isValid: true,
      error: null,
      user: session.user
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      isValid: false,
      error: 'Session validation failed',
      user: null
    }
  }
}

/**
 * Validates admin session server-side
 * Checks admin session cookie with 2-minute expiry
 */
export async function validateAdminSession(req: Request, res: Response) {
  try {
    const adminSessionCookie = req.cookies['admin-session']
    
    if (!adminSessionCookie) {
      return {
        isValid: false,
        error: 'No admin session found',
        admin: null
      }
    }

    // Decode and validate admin session
    const sessionData = JSON.parse(atob(adminSessionCookie))
    const now = Date.now()
    const sessionAge = now - sessionData.timestamp
    const SESSION_TIMEOUT = 2 * 60 * 1000 // 2 minutes

    if (sessionAge > SESSION_TIMEOUT) {
      // Clear expired session cookie
      res.setHeader('Set-Cookie', 'admin-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; httpOnly=true; secure=true; sameSite=strict')
      return {
        isValid: false,
        error: 'Admin session expired',
        admin: null
      }
    }

    return {
      isValid: true,
      error: null,
      admin: {
        email: sessionData.email,
        role: sessionData.role,
        timestamp: sessionData.timestamp
      }
    }
  } catch (error) {
    console.error('Admin session validation error:', error)
    return {
      isValid: false,
      error: 'Admin session validation failed',
      admin: null
    }
  }
}

/**
 * Higher-order function to protect API routes with user authentication
 */
export function withAuth(handler: (req: Request, res: Response, user: any) => Promise<void>) {
  return async (req: Request, res: Response) => {
    const validation = await validateUserSession(req, res)
    
    if (!validation.isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: validation.error
      })
    }

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return handler(req, res, validation.user)
  }
}

/**
 * Higher-order function to protect API routes with admin authentication
 */
export function withAdminAuth(handler: (req: Request, res: Response, admin: any) => Promise<void>) {
  return async (req: Request, res: Response) => {
    const validation = await validateAdminSession(req, res)
    
    if (!validation.isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: validation.error
      })
    }

    // Add security headers for admin routes
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    
    return handler(req, res, validation.admin)
  }
}

/**
 * Higher-order function to protect admin routes with role-based access control
 */
export function withAdminRole(
  requiredRole: 'super_admin' | 'admin' | 'moderator',
  handler: (req: Request, res: Response, admin: any) => Promise<void>
) {
  return withAdminAuth(async (req: Request, res: Response, admin: any) => {
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'moderator': 1
    }

    const userRoleLevel = roleHierarchy[admin.role as keyof typeof roleHierarchy] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required: ${requiredRole}, User: ${admin.role}`
      })
      return
    }

    return handler(req, res, admin)
  })
}

/**
 * Security headers for admin requests
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
}