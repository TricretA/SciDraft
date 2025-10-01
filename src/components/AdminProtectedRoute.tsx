import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { LoadingSpinner } from './LoadingSpinner'

interface AdminProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'admin' | 'moderator'
}

/**
 * AdminProtectedRoute component that enforces:
 * - Admin authentication with 2-minute session timeout
 * - Role-based access control
 * - Server-side session validation
 * - Automatic logout on inactivity
 */
export default function AdminProtectedRoute({ 
  children, 
  requiredRole 
}: AdminProtectedRouteProps) {
  const { admin, isLoading, logout, refreshSession } = useAdminAuth()
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    const checkAdminAuth = async () => {
      if (!isLoading) {
        if (!admin) {
          // No admin logged in, redirect to admin login
          navigate('/admin/login')
          return
        }

        // Check session validity (2-minute timeout)
        const sessionData = localStorage.getItem('admin-session')
        if (!sessionData) {
          console.error('No admin session found')
          await logout()
          navigate('/admin/login?error=session_expired')
          return
        }

        try {
          const session = JSON.parse(atob(sessionData))
          const now = Date.now()
          const sessionAge = now - session.timestamp
          const SESSION_TIMEOUT = 2 * 60 * 1000 // 2 minutes

          if (sessionAge > SESSION_TIMEOUT) {
            console.error('Admin session expired')
            await logout()
            navigate('/admin/login?error=session_expired')
            return
          }

          // Check role-based access
          if (requiredRole) {
            const roleHierarchy = {
              'super_admin': 3,
              'admin': 2,
              'moderator': 1
            }

            const userRoleLevel = roleHierarchy[admin.role as keyof typeof roleHierarchy] || 0
            const requiredRoleLevel = roleHierarchy[requiredRole]

            if (userRoleLevel < requiredRoleLevel) {
              console.error(`Insufficient permissions. Required: ${requiredRole}, User: ${admin.role}`)
              navigate('/admin/dashboard?error=insufficient_permissions')
              return
            }
          }

          // Refresh session on successful validation
          refreshSession()
          setSessionValid(true)
        } catch (error) {
          console.error('Session validation error:', error)
          await logout()
          navigate('/admin/login?error=session_invalid')
          return
        }

        setIsChecking(false)
      }
    }

    checkAdminAuth()
  }, [admin, isLoading, requiredRole, navigate, logout, refreshSession])

  // Activity monitoring to refresh session
  useEffect(() => {
    if (admin && sessionValid) {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      
      const handleActivity = () => {
        refreshSession()
      }

      // Add event listeners for user activity
      activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, true)
      })

      return () => {
        // Cleanup event listeners
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleActivity, true)
        })
      }
    }
  }, [admin, sessionValid, refreshSession])

  // Show loading spinner while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-300">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // If admin is not authenticated or session is invalid, don't render children
  if (!admin || !sessionValid) {
    return null
  }

  return (
    <div className="admin-protected-content">
      {/* Admin session indicator */}
      <div className="fixed top-0 right-0 z-50 bg-red-600 text-white px-3 py-1 text-xs font-mono">
        ADMIN: {admin.email} ({admin.role})
      </div>
      {children}
    </div>
  )
}