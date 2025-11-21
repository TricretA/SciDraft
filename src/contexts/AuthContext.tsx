import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (...args: any[]) => Promise<{ error?: string }>
  signUp: (...args: any[]) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  resetPassword: (...args: any[]) => Promise<{ error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUser(null)
    setLoading(false)
  }, [])

  const signIn = async (): Promise<{ error?: string }> => ({ error: 'Authentication disabled' })
  const signUp = async (): Promise<{ error?: any }> => ({ error: { message: 'Authentication disabled' } })
  const signOut = async () => {}
  const resetPassword = async (): Promise<{ error?: string }> => ({ error: 'Authentication disabled' })

  const value: AuthContextType = { user, loading, signIn, signUp, signOut, resetPassword }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
