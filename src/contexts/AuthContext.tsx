import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string, phoneNumber?: string) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // DISABLE AUTOMATIC LOGIN - Clear any existing session on app start
    const clearSessionAndInitialize = async () => {
      try {
        // Always sign out on app initialization to prevent automatic login
        await supabase.auth.signOut()
        console.log('Automatic login disabled - session cleared on app start')
        
        // Reset all auth state
        setSupabaseUser(null)
        setUser(null)
      } catch (error) {
        console.error('Error clearing session:', error)
      } finally {
        setLoading(false)
      }
    }

    clearSessionAndInitialize()

    // Listen for auth changes with email confirmation enforcement
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      // MANDATORY EMAIL CONFIRMATION CHECK
      if (session?.user && !session.user.email_confirmed_at) {
        console.log('Auth state change blocked - email not confirmed for user:', session.user.id)
        // Sign out immediately if email is not confirmed
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    const maxRetries = 3
    const timeoutMs = 5000 // 5 seconds timeout
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
      })
      
      // Race between the database query and timeout
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching user profile:', error)
        
        // If user doesn't exist, create a fallback profile
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log('User profile not found, creating fallback profile')
          await createFallbackUserProfile(userId)
          return
        }
        
        // Retry on other errors with exponential backoff
        if (retryCount < maxRetries) {
          const backoffDelay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
          console.log(`Retrying profile fetch in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1)
          }, backoffDelay)
          return
        }
        
        // Max retries reached, create fallback
        console.warn('Max retries reached, creating fallback profile')
        await createFallbackUserProfile(userId)
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      
      // Retry on timeout or network errors
      if (retryCount < maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000
        console.log(`Retrying profile fetch after error in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
        setTimeout(() => {
          fetchUserProfile(userId, retryCount + 1)
        }, backoffDelay)
        return
      }
      
      // Max retries reached, create fallback
      console.warn('Max retries reached after errors, creating fallback profile')
      await createFallbackUserProfile(userId)
    } finally {
      // Always ensure loading is set to false
      setLoading(false)
    }
  }
  
  const createFallbackUserProfile = async (userId: string) => {
    try {
      // Get user email from Supabase auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const fallbackUser: User = {
          id: userId,
          email: authUser.email || 'unknown@example.com',
          name: authUser.user_metadata?.name || 'User',
          role: 'student' as const,
          active_plan: 'free' as const,
          preferred_mpesa_number: null,
          created_at: new Date().toISOString()
        }
        
        // Try to insert the fallback profile
        const { error: insertError } = await supabase
          .from('users')
          .insert(fallbackUser)
        
        if (insertError) {
          console.error('Failed to create fallback profile:', insertError)
          // Set a minimal user object even if database insert fails
          setUser(fallbackUser)
        } else {
          console.log('Fallback profile created successfully')
          setUser(fallbackUser)
        }
      }
    } catch (error) {
      console.error('Error creating fallback profile:', error)
      // Set a minimal user object as last resort
      setUser({
        id: userId,
        email: 'unknown@example.com',
        name: 'User',
        role: 'student' as const,
        active_plan: 'free' as const,
        preferred_mpesa_number: null,
        created_at: new Date().toISOString()
      })
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error: error.message }
      }

      if (data.user) {
        // MANDATORY EMAIL CONFIRMATION CHECK
        if (!data.user.email_confirmed_at) {
          console.log('Login blocked - email not confirmed for user:', data.user.id)
          // Sign out the user immediately since email is not confirmed
          await supabase.auth.signOut()
          return { 
            error: 'Please verify your email address before signing in. Check your inbox for a confirmation link.' 
          }
        }

        console.log('Sign in successful for user:', data.user.id)
        // The auth state change will be handled by the listener
        return {}
      }

      return { error: 'Sign in failed' }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { error: error.message || 'An error occurred during sign in' }
    }
  }

  const signUp = async (email: string, password: string, name: string, phoneNumber?: string) => {
    try {
      // Validate required fields with detailed messages
      if (!email?.trim()) {
        return { 
          error: { 
            message: 'Email address is required',
            type: 'validation_error',
            field: 'email'
          } 
        }
      }

      if (!password) {
        return { 
          error: { 
            message: 'Password is required',
            type: 'validation_error',
            field: 'password'
          } 
        }
      }

      if (!name?.trim()) {
        return { 
          error: { 
            message: 'Full name is required',
            type: 'validation_error',
            field: 'name'
          } 
        }
      }

      // Validate password strength
      if (password.length < 6) {
        return { 
          error: { 
            message: 'Password must be at least 6 characters long',
            type: 'validation_error',
            field: 'password'
          } 
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return { 
          error: { 
            message: 'Please enter a valid email address',
            type: 'validation_error',
            field: 'email'
          } 
        }
      }

      // Validate name length
      if (name.trim().length < 2) {
        return { 
          error: { 
            message: 'Name must be at least 2 characters long',
            type: 'validation_error',
            field: 'name'
          } 
        }
      }

      // Validate phone number if provided
      if (phoneNumber && phoneNumber.trim()) {
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/
        if (!phoneRegex.test(phoneNumber.trim())) {
          return { 
            error: { 
              message: 'Please enter a valid phone number',
              type: 'validation_error',
              field: 'phoneNumber'
            } 
          }
        }
      }

      console.log('Starting signup process for:', email)

      // Attempt Supabase authentication signup - MANDATORY EMAIL CONFIRMATION
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
          data: {
            name: name.trim(),
            phone_number: phoneNumber?.trim() || null,
          },
        },
      })

      // Handle authentication errors with specific messages
      if (authError) {
        console.error('Authentication signup error:', authError)
        
        let errorMessage = 'Failed to create account'
        let errorType = 'auth_error'
        
        // Provide specific error messages based on error code
        if (authError.message?.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.'
          errorType = 'duplicate_user'
        } else if (authError.message?.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address'
          errorType = 'validation_error'
        } else if (authError.message?.includes('password')) {
          errorMessage = 'Password does not meet requirements. Please choose a stronger password.'
          errorType = 'validation_error'
        } else if (authError.message?.includes('rate limit')) {
          errorMessage = 'Too many signup attempts. Please wait a few minutes and try again.'
          errorType = 'rate_limit'
        } else if (authError.message) {
          errorMessage = authError.message
        }
        
        return { 
          error: {
            message: errorMessage,
            type: errorType,
            code: authError.status || authError.code,
            details: authError
          }
        }
      }

      // If auth succeeded but no user returned, something went wrong
      if (!data.user) {
        console.error('No user data returned after successful auth')
        return { 
          error: {
            message: 'Account creation failed - please try again or contact support',
            type: 'auth_error'
          }
        }
      }

      console.log('Authentication successful, user ID:', data.user.id)
      console.log('Email confirmation required:', !data.user.email_confirmed_at)

      // MANDATORY EMAIL CONFIRMATION - Do not create profile or login until email is confirmed
      if (!data.user.email_confirmed_at) {
        console.log('Email confirmation required - user must verify email before login')
        return { 
          requiresConfirmation: true,
          error: {
            message: 'Please check your email and click the confirmation link to activate your account. You must verify your email before you can sign in.',
            type: 'email_confirmation_required'
          }
        }
      }

      console.log('Email already confirmed, proceeding with profile creation...')
      
      // Wait for the database trigger to complete with retry logic
      const maxRetries = 3
      let profile = null
      let profileError = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Wait progressively longer between attempts
        const waitTime = attempt * 1000 // 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        console.log(`Checking profile creation (attempt ${attempt}/${maxRetries})...`)
        
        const { data: profileData, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (checkError) {
          profileError = checkError
          console.log(`Profile check attempt ${attempt} failed:`, checkError.message)
          
          // If it's the last attempt, break
          if (attempt === maxRetries) {
            break
          }
          continue
        }
        
        if (profileData) {
          profile = profileData
          profileError = null
          console.log('Profile found successfully:', profileData)
          break
        }
      }
      
      // If profile creation failed after all retries, try manual creation as fallback
      if (!profile) {
        console.warn('Profile not created by trigger, attempting manual creation...')
        
        const fallbackProfile = {
          id: data.user.id,
          email: email.trim(),
          name: name.trim(),
          role: 'student' as const,
          active_plan: 'free' as const,
          preferred_mpesa_number: phoneNumber?.trim() || null
        }
        
        const { data: insertedProfile, error: insertError } = await supabase
          .from('users')
          .insert(fallbackProfile)
          .select()
          .single()
        
        if (insertError) {
          console.error('Manual profile creation also failed:', insertError)
          
          // Provide specific error message based on the error
          let errorMessage = 'Account created but profile setup failed. Please contact support.'
          
          if (insertError.message?.includes('duplicate key')) {
            errorMessage = 'Account already exists. Please try logging in instead.'
          } else if (insertError.message?.includes('permission denied') || insertError.code === '42501') {
            errorMessage = 'Database permission error. Please contact support to complete your account setup.'
          } else if (insertError.message?.includes('violates')) {
            errorMessage = 'Invalid account data. Please check your information and try again.'
          }
          
          return { 
            error: {
              message: errorMessage,
              type: 'database_error',
              code: insertError.code,
              details: {
                authSuccess: true,
                profileError: insertError,
                userId: data.user.id
              }
            }
          }
        }
        
        profile = insertedProfile
        console.log('Manual profile creation successful:', profile)
      }
      
      console.log('Signup completed successfully for user:', data.user.id)
      return { 
        error: null,
        data: {
          user: data.user,
          profile: profile
        }
      }
      
    } catch (exception: any) {
      console.error('Unexpected error during signup:', exception)
      
      let errorMessage = 'An unexpected error occurred during signup. Please try again.'
      
      // Provide more specific error messages for common exceptions
      if (exception.message?.includes('network') || exception.message?.includes('fetch')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.'
      } else if (exception.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      }
      
      return { 
        error: {
          message: errorMessage,
          type: 'unexpected_error',
          details: exception
        }
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}