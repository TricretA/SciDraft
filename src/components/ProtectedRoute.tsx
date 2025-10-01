import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (requireAuth) {
          if (!user) {
            // Store the current path for redirect after login
            const currentPath = window.location.pathname
            navigate(`/login?redirect=${encodeURIComponent(currentPath)}`)
            return
          }

          // Additional server-side session validation
          try {
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error || !session || !session.user) {
              console.error('Session validation failed:', error)
              navigate('/login?error=session_invalid')
              return
            }

            // Check if email is confirmed
            if (!session.user.email_confirmed_at) {
              navigate('/login?error=email_not_confirmed')
              return
            }

            // Ensure the session user matches the context user
            if (session.user.id !== user.id) {
              console.error('Session user mismatch')
              navigate('/login?error=session_mismatch')
              return
            }

            setSessionValid(true)
          } catch (error) {
            console.error('Session check error:', error)
            navigate('/login?error=session_check_failed')
            return
          }
        } else {
          setSessionValid(true)
        }
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [user, loading, requireAuth, navigate])

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If auth is required but user is not authenticated or session is invalid, don't render children
  if (requireAuth && (!user || !sessionValid)) {
    return null
  }

  return <>{children}</>
}