import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  Shield,
  Cog,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  path: string
  adminOnly?: boolean
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/system' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
  { id: 'prompts', label: 'Prompts', icon: Settings, path: '/admin/prompts' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
  { id: 'admins', label: 'Admins', icon: Shield, path: '/admin/admins' },
  { id: 'system', label: 'System', icon: Cog, path: '/admin/system', adminOnly: true }
]

export function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Admin authentication removed; page accessible

  const handleSignOut = async () => {
    try {
      // Clear admin authentication state
      await logout();
      
      // Clear any stored session data
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_token');
      sessionStorage.clear();
      
      // Redirect to default route
      navigate('/new-report');
    } catch (error) {
      console.error('Logout failed:', error);
      // Redirect to default even if logout fails
      navigate('/new-report');
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/'
    }
    return location.pathname.startsWith(path)
  }

  const filteredSidebarItems = sidebarItems

  // Mock notifications - in real app, fetch from Supabase
  const notifications = [
    { id: 1, message: 'New user registration', time: '2 min ago', type: 'info' },
    { id: 2, message: 'Payment failed', time: '5 min ago', type: 'error' },
    { id: 3, message: 'Export completed', time: '10 min ago', type: 'success' },
    { id: 4, message: 'New feedback received', time: '15 min ago', type: 'info' },
    { id: 5, message: 'System maintenance scheduled', time: '1 hour ago', type: 'warning' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="h-full bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">SciDraft Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-4 space-y-2">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.path)
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Topbar */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-blue-300"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => navigate('/admin/notifications')}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-blue-200" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">3</span>
                  </span>
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/20">
                      <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-white/10 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'error' ? 'bg-red-500' :
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm text-white">{notification.message}</p>
                              <p className="text-xs text-blue-300 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{admin.fullName || 'Admin'}</p>
                    <p className="text-xs text-blue-300">{admin.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-blue-300" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/20">
                      <p className="text-sm font-medium text-white">{admin.fullName || 'Admin'}</p>
                      <p className="text-xs text-blue-300">{admin.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-white/10 transition-colors text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(profileDropdownOpen || notificationsOpen) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setProfileDropdownOpen(false)
            setNotificationsOpen(false)
          }}
        />
      )}
    </div>
  )
}
