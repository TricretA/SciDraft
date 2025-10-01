import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminAuth, withAdminRole } from '../../contexts/AdminAuthContext'
import {
  Settings,
  CreditCard,
  FileText,
  MessageCircle,
  DollarSign,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  Shield,
  Database,
  Server,
  Activity
} from 'lucide-react'

interface SystemSettings {
  id: string
  payments_enabled: boolean
  draft_report_price: number
  full_report_price: number
  exports_enabled: boolean
  chat_enabled: boolean
  maintenance_mode: boolean
  max_reports_per_user: number
  session_timeout_minutes: number
  updated_at: string
  updated_by: string
}

interface SystemStats {
  total_users: number
  active_sessions: number
  pending_exports: number
  failed_exports_24h: number
  revenue_today: number
  system_uptime: string
}

function AdminSystemSettingsComponent() {
  const { admin } = useAdminAuth()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState<Partial<SystemSettings>>({})

  useEffect(() => {
    fetchSettings()
    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Create default settings if none exist
        const defaultSettings = {
          payments_enabled: true,
          draft_report_price: 5.00,
          full_report_price: 15.00,
          exports_enabled: true,
          chat_enabled: true,
          maintenance_mode: false,
          max_reports_per_user: 10,
          session_timeout_minutes: 30,
          updated_by: admin?.id || ''
        }

        const { data: newSettings, error: createError } = await supabase
          .from('system_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) throw createError
        setSettings(newSettings)
      } else {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch system statistics
      const [usersResult, sessionsResult, exportsResult, revenueResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id').not('last_login', 'is', null),
        supabase.from('exports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('amount').eq('status', 'success')
          .gte('created_at', new Date().toISOString().split('T')[0])
      ])

      const totalUsers = usersResult.count || 0
      const activeSessions = sessionsResult.data?.length || 0
      const pendingExports = exportsResult.count || 0
      const revenueToday = revenueResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Get failed exports in last 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: failedExports } = await supabase
        .from('exports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', yesterday)

      setStats({
        total_users: totalUsers,
        active_sessions: activeSessions,
        pending_exports: pendingExports,
        failed_exports_24h: failedExports?.length || 0,
        revenue_today: revenueToday,
        system_uptime: '99.9%' // This would come from monitoring service
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSaveSettings = async () => {
    if (!settings || !hasChanges) return

    setSaving(true)
    try {
      const updatedSettings = {
        ...settings,
        ...tempSettings,
        updated_by: admin?.id || '',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('system_settings')
        .update(updatedSettings)
        .eq('id', settings.id)

      if (error) throw error

      setSettings(updatedSettings)
      setTempSettings({})
      setHasChanges(false)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetChanges = () => {
    setTempSettings({})
    setHasChanges(false)
  }

  const getCurrentValue = (key: keyof SystemSettings) => {
    return tempSettings[key] !== undefined ? tempSettings[key] : settings?.[key]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Redirect if not super admin
  if (admin?.role !== 'Super Admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only Super Admins can access System Settings.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure global system parameters and controls</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved}
            </span>
          )}
          
          {hasChanges && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetChanges}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_sessions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.system_uptime || '0%'}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Server className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenue_today || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Settings</h3>
                <p className="text-sm text-gray-600">Configure payment system and pricing</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Enable/Disable Payments */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Payment System</label>
                <p className="text-sm text-gray-600">Enable or disable the entire payment system</p>
              </div>
              <button
                onClick={() => handleSettingChange('payments_enabled', !getCurrentValue('payments_enabled'))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('payments_enabled') ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('payments_enabled') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Draft Report Price */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Draft Report Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={String(getCurrentValue('draft_report_price') || 0)}
                  onChange={(e) => handleSettingChange('draft_report_price', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  disabled={!getCurrentValue('payments_enabled')}
                />
              </div>
            </div>

            {/* Full Report Price */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Report Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={String(getCurrentValue('full_report_price') || 0)}
                  onChange={(e) => handleSettingChange('full_report_price', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  disabled={!getCurrentValue('payments_enabled')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Report Settings</h3>
                <p className="text-sm text-gray-600">Configure report generation and exports</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Enable/Disable Exports */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Export System</label>
                <p className="text-sm text-gray-600">Enable or disable report exports temporarily</p>
              </div>
              <button
                onClick={() => handleSettingChange('exports_enabled', !getCurrentValue('exports_enabled'))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('exports_enabled') ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('exports_enabled') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Max Reports Per User */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Max Reports Per User
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={String(getCurrentValue('max_reports_per_user') || 10)}
                onChange={(e) => handleSettingChange('max_reports_per_user', parseInt(e.target.value) || 10)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Export Queue Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Export Queue</span>
                <button
                  onClick={fetchStats}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Pending:</span>
                  <span className="ml-2 font-medium text-gray-900">{stats?.pending_exports || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Failed (24h):</span>
                  <span className="ml-2 font-medium text-red-600">{stats?.failed_exports_24h || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chat Settings</h3>
                <p className="text-sm text-gray-600">Configure AI chat functionality</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Enable/Disable Chat */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">AI Chat System</label>
                <p className="text-sm text-gray-600">Enable or disable AI chat assistance</p>
              </div>
              <button
                onClick={() => handleSettingChange('chat_enabled', !getCurrentValue('chat_enabled'))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('chat_enabled') ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('chat_enabled') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!getCurrentValue('chat_enabled') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Chat is currently disabled. Users will not be able to access AI assistance.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                <p className="text-sm text-gray-600">Configure security and maintenance</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Session Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Admin Session Timeout (minutes)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={String(getCurrentValue('session_timeout_minutes') || 30)}
                  onChange={(e) => handleSettingChange('session_timeout_minutes', parseInt(e.target.value) || 30)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Admin sessions will expire after this period of inactivity
              </p>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                <p className="text-sm text-gray-600">Put the system in maintenance mode</p>
              </div>
              <button
                onClick={() => handleSettingChange('maintenance_mode', !getCurrentValue('maintenance_mode'))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('maintenance_mode') ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('maintenance_mode') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {getCurrentValue('maintenance_mode') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> Maintenance mode will prevent all users from accessing the system.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {settings && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Last updated: {formatDate(settings.updated_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Updated by: {settings.updated_by}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export with Super Admin role protection
export const AdminSystemSettings = withAdminRole(AdminSystemSettingsComponent, { requiredRole: 'Super Admin' })