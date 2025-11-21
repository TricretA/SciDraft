import React, { createContext, useContext } from 'react'

interface AdminUser {
  id: string
  email: string
  role: 'Super Admin' | 'Content Admin' | 'Support Admin'
}

interface AdminAuthContextType {
  admin: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (...args: any[]) => Promise<void>
  logout: () => void
  hasRole: (role: any) => boolean
  hasPermission: (permission: string) => boolean
  refreshSession: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: AdminAuthContextType = {
    admin: null,
    isLoading: false,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
    hasRole: () => true,
    hasPermission: () => true,
    refreshSession: async () => {},
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
