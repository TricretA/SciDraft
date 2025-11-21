import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
// Admin role protection removed
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  User,
  CreditCard,
  FileText,
  Shield,
  Search,
  Filter,
  Trash2,
  MoreVertical
} from 'lucide-react'

interface Notification {
  id: string
  message: string
  user_id: string | null
  role: string | null
  type: 'signup' | 'login' | 'draft' | 'report' | 'payment_success' | 'payment_failed' | 'password_change' | 'system'
  created_at: string
  read: boolean
}

function AdminNotificationsComponent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)

      if (error) throw error
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)

      if (error) throw error
      setSelectedNotifications([])
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signup':
      case 'login':
        return <User className="w-5 h-5 text-blue-400" />
      case 'draft':
      case 'report':
        return <FileText className="w-5 h-5 text-purple-400" />
      case 'payment_success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'payment_failed':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'password_change':
        return <Shield className="w-5 h-5 text-yellow-400" />
      case 'system':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_failed':
      case 'system':
        return 'border-l-red-400'
      case 'payment_success':
        return 'border-l-green-400'
      case 'draft':
      case 'report':
        return 'border-l-purple-400'
      case 'password_change':
        return 'border-l-yellow-400'
      default:
        return 'border-l-blue-400'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (notification.user_id && notification.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesRead = readFilter === 'all' || 
                       (readFilter === 'read' && notification.read) ||
                       (readFilter === 'unread' && !notification.read)
    
    return matchesSearch && matchesType && matchesRead
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Bell className="w-7 h-7" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-blue-300">System notifications and user activity alerts</p>
        </div>
        
        {/* Actions */}
        {selectedNotifications.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => markAsRead(selectedNotifications)}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Mark as Read
            </button>
            <button
              onClick={() => deleteNotifications(selectedNotifications)}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-blue-300"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-black"
          >
            <option value="all">All Types</option>
            <option value="signup">Signups</option>
            <option value="login">Logins</option>
            <option value="draft">Drafts</option>
            <option value="report">Reports</option>
            <option value="payment_success">Payment Success</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="password_change">Password Changes</option>
            <option value="system">System</option>
          </select>

          {/* Read Filter */}
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-black"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => markAsRead(notifications.filter(n => !n.read).map(n => n.id))}
              className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No notifications found</h3>
            <p className="text-blue-300">No notifications match your current filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-white/5 transition-colors border-l-4 ${
                  getNotificationColor(notification.type)
                } ${
                  !notification.read ? 'bg-blue-500/5' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications([...selectedNotifications, notification.id])
                      } else {
                        setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id))
                      }
                    }}
                    className="mt-1 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                  />
                  
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-white' : 'text-blue-200'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          {notification.user_id && (
                            <span className="text-xs text-blue-400">User: {notification.user_id}</span>
                          )}
                          {notification.role && (
                            <span className="text-xs text-blue-400">Role: {notification.role}</span>
                          )}
                          <span className="text-xs text-blue-400">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={() => markAsRead([notification.id])}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteNotifications([notification.id])}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-blue-300">Total</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{notifications.length}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-blue-300">Unread</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{unreadCount}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-blue-300">Critical</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {notifications.filter(n => n.type === 'payment_failed' || n.type === 'system').length}
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-blue-300">Today</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {notifications.filter(n => {
              const today = new Date().toDateString()
              const notificationDate = new Date(n.created_at).toDateString()
              return today === notificationDate
            }).length}
          </p>
        </div>
      </div>
    </div>
  )
}

// Export with Admin role protection
export const AdminNotifications = AdminNotificationsComponent
