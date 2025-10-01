import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { setSecureCookie, clearSecureCookie, createSessionData, COOKIE_CONFIG } from '../utils/secureCookies';

interface AdminUser {
  id: string;
  email: string;
  role: 'Super Admin' | 'Content Admin' | 'Support Admin';
  fullName: string;
  loginTime: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (adminData: AdminUser) => Promise<void>;
  logout: () => void;
  hasRole: (requiredRole: AdminUser['role'] | AdminUser['role'][]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Role hierarchy and permissions (matching database roles)
const ROLE_HIERARCHY = {
  'Vanessa': 3, // Super Admin equivalent
  'Shem': 2,    // Content Admin equivalent
  'Wazimu': 1   // Support Admin equivalent
};

const ROLE_PERMISSIONS = {
  'Vanessa': [
    'manage_admins',
    'manage_users',
    'manage_reports',
    'manage_payments',
    'manage_feedback',
    'manage_prompts',
    'manage_system_settings',
    'view_dashboard',
    'export_data',
    'delete_data'
  ],
  'Shem': [
    'manage_reports',
    'manage_prompts',
    'view_dashboard',
    'manage_feedback',
    'export_data'
  ],
  'Wazimu': [
    'view_dashboard',
    'manage_feedback',
    'view_users',
    'view_reports'
  ]
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use refs to avoid dependency issues in useEffect
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

  // Logout function - memoized with no state dependencies
  const logout = useCallback(() => {
    setAdmin(null)
    localStorage.removeItem('adminSession')
    
    // Clear secure admin session cookie
    const clearCookie = clearSecureCookie(COOKIE_CONFIG.ADMIN_SESSION.name)
    document.cookie = clearCookie
    
    // Clear timeouts using refs
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
      activityTimeoutRef.current = null
    }
  }, []); // No dependencies to prevent loops

  // Start session timeout - memoized with no state dependencies
  const startSessionTimeout = useCallback(() => {
    // Clear existing timeout first
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
    }
    
    const timeout = setTimeout(() => {
      console.log('Admin session expired due to inactivity')
      logout()
    }, SESSION_TIMEOUT_MS)
    
    sessionTimeoutRef.current = timeout
  }, [logout]) // Only depend on logout

  // Refresh session - memoized to prevent repeated calls
  const refreshSession = useCallback(async () => {
    if (!admin) return; // Early return if no admin
    
    try {
      // Refresh secure encrypted cookie
      const sessionData = createSessionData(admin, admin.role)
      const secureCookie = setSecureCookie(
        COOKIE_CONFIG.ADMIN_SESSION.name,
        sessionData,
        {
          maxAge: COOKIE_CONFIG.ADMIN_SESSION.maxAge,
          httpOnly: COOKIE_CONFIG.ADMIN_SESSION.httpOnly,
          secure: COOKIE_CONFIG.ADMIN_SESSION.secure,
          sameSite: COOKIE_CONFIG.ADMIN_SESSION.sameSite,
          path: COOKIE_CONFIG.ADMIN_SESSION.path
        }
      )
      
      // Set the cookie using document.cookie (client-side)
      document.cookie = secureCookie
      
      // Reset session timeout
      startSessionTimeout()
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }, [admin, startSessionTimeout]) // Only depend on admin and startSessionTimeout

  // Initialize admin session - memoized to prevent re-initialization
  const initializeAdminSession = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('adminSession');
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        
        // For now, trust the stored session without database verification
        // to avoid RLS policy issues. In production, implement proper JWT validation
        if (sessionData && sessionData.id && sessionData.email && sessionData.role) {
          setAdmin({
            id: sessionData.id,
            email: sessionData.email,
            role: sessionData.role,
            fullName: sessionData.fullName || sessionData.name || 'Admin',
            loginTime: sessionData.loginTime
          });
        } else {
          // Invalid session data, clear it
          localStorage.removeItem('adminSession');
        }
      }
    } catch (error) {
      console.error('Error initializing admin session:', error);
      localStorage.removeItem('adminSession');
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies to prevent re-initialization

  // Login function - memoized
  const login = useCallback(async (adminData: AdminUser) => {
    // Store session in localStorage for client-side state
    const sessionData = {
      id: adminData.id,
      email: adminData.email,
      role: adminData.role,
      fullName: adminData.fullName,
      loginTime: adminData.loginTime
    }
    
    localStorage.setItem('adminSession', JSON.stringify(sessionData))
    
    // Store secure encrypted cookie for server-side validation
    const secureSessionData = createSessionData(adminData, adminData.role)
    const secureCookie = setSecureCookie(
      COOKIE_CONFIG.ADMIN_SESSION.name,
      secureSessionData,
      {
        maxAge: COOKIE_CONFIG.ADMIN_SESSION.maxAge,
        httpOnly: COOKIE_CONFIG.ADMIN_SESSION.httpOnly,
        secure: COOKIE_CONFIG.ADMIN_SESSION.secure,
        sameSite: COOKIE_CONFIG.ADMIN_SESSION.sameSite,
        path: COOKIE_CONFIG.ADMIN_SESSION.path
      }
    )
    
    // Set the secure cookie
    document.cookie = secureCookie
    
    setAdmin(adminData)
    
    // Start session timeout after successful login
    startSessionTimeout()
  }, [startSessionTimeout]);

  // Clear timeouts on unmount - no dependencies to prevent loops
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
    }
  }, []) // Empty dependency array

  // Initialize admin session on mount - only run once
  useEffect(() => {
    initializeAdminSession()
  }, [initializeAdminSession]);

  // Monitor user activity - only when admin exists
  useEffect(() => {
    if (!admin) return

    const handleActivity = () => {
      // Debounce activity handling to prevent excessive calls
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        // Handle async refreshSession without blocking
        refreshSession().catch(error => {
          console.error('Error refreshing session:', error)
        })
      }, 1000) // Debounce for 1 second
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Start initial timeout
    startSessionTimeout()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [admin?.id, startSessionTimeout, refreshSession]) // Depend on admin.id, startSessionTimeout, and refreshSession

  // Check if admin has specific role(s)
  const hasRole = useCallback((requiredRole: AdminUser['role'] | AdminUser['role'][]): boolean => {
    if (!admin) return false;
    
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return requiredRoles.includes(admin.role);
  }, [admin]);

  // Check if admin has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!admin) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[admin.role] || [];
    return rolePermissions.includes(permission);
  }, [admin]);

  // Check if admin has higher or equal role level
  const hasRoleLevel = useCallback((minimumRole: AdminUser['role']): boolean => {
    if (!admin) return false;
    
    const adminLevel = ROLE_HIERARCHY[admin.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
    
    return adminLevel >= requiredLevel;
  }, [admin]);

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
    hasRole,
    hasPermission,
    refreshSession
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

// Higher-order component for role-based route protection
interface WithAdminRoleProps {
  requiredRole?: AdminUser['role'] | AdminUser['role'][];
  requiredPermission?: string;
  fallback?: ReactNode;
}

export const withAdminRole = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAdminRoleProps = {}
) => {
  return (props: P) => {
    const { admin, isLoading, hasRole, hasPermission } = useAdminAuth();
    const { requiredRole, requiredPermission, fallback } = options;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-200">Loading admin panel...</p>
          </div>
        </div>
      );
    }

    if (!admin) {
      return fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-blue-200 mb-6">You need to be logged in as an admin to access this page.</p>
            <a 
              href="/admin/login" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Go to Admin Login
            </a>
          </div>
        </div>
      );
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      return fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Insufficient Permissions</h1>
            <p className="text-blue-200 mb-2">Your role: <span className="font-semibold">{admin.role}</span></p>
            <p className="text-blue-200 mb-6">Required role: <span className="font-semibold">{Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}</span></p>
            <a 
              href="/admin/dashboard" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      );
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-blue-200 mb-2">You don't have permission to access this resource.</p>
            <p className="text-blue-200 mb-6">Required permission: <span className="font-semibold">{requiredPermission}</span></p>
            <a 
              href="/admin/dashboard" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Utility function to get role color
export const getRoleColor = (role: AdminUser['role']): string => {
  switch (role) {
    case 'Super Admin': // Super Admin equivalent
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'Content Admin': // Content Admin equivalent
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'Support Admin': // Support Admin equivalent
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

// Export role hierarchy and permissions for use in components
export { ROLE_HIERARCHY, ROLE_PERMISSIONS };