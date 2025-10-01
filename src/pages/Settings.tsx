import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Globe, 
  Palette, 
  Download, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  Camera, 
  Check, 
  X, 
  AlertCircle, 
  Shield, 
  CreditCard, 
  FileText, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  ArrowLeft,
  Phone
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Theme = 'light' | 'dark' | 'system'
type Language = 'en' | 'es' | 'fr' | 'de' | 'zh'

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  institution?: string
  student_id?: string
  preferred_mpesa_number?: string
  bio?: string
  created_at: string
}

interface NotificationSettings {
  email_reports: boolean
  email_updates: boolean
  email_marketing: boolean
  push_reports: boolean
  push_reminders: boolean
  push_updates: boolean
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'institution'
  show_email: boolean
  show_institution: boolean
  allow_collaboration: boolean
  data_sharing: boolean
}

export function Settings() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: '',
    institution: '',
    student_id: '',
    preferred_mpesa_number: '',
    bio: ''
  })
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Preferences state
  const [theme, setTheme] = useState<Theme>('system')
  const [language, setLanguage] = useState<Language>('en')
  const [timezone, setTimezone] = useState('UTC')
  
  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_reports: true,
    email_updates: true,
    email_marketing: false,
    push_reports: true,
    push_reminders: true,
    push_updates: false
  })
  
  // Privacy state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profile_visibility: 'institution',
    show_email: false,
    show_institution: true,
    allow_collaboration: true,
    data_sharing: false
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      setProfile(data)
      setProfileForm({
        name: data.name || '',
        institution: data.institution || '',
        student_id: data.student_id || '',
        preferred_mpesa_number: data.preferred_mpesa_number || '',
        bio: data.bio || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileForm.name,
          institution: profileForm.institution,
          student_id: profileForm.student_id,
          preferred_mpesa_number: profileForm.preferred_mpesa_number,
          bio: profileForm.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    
    if (passwordForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Password updated successfully' })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: 'Failed to update password' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    setSaving(true)
    try {
      // In a real app, this would handle account deletion properly
      await signOut()
      setMessage({ type: 'success', text: 'Account deletion initiated' })
    } catch (error) {
      console.error('Error deleting account:', error)
      setMessage({ type: 'error', text: 'Failed to delete account' })
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setSaving(true)
    try {
      // In a real app, this would generate and download user data
      await new Promise(resolve => setTimeout(resolve, 2000))
      setMessage({ type: 'success', text: 'Data export will be emailed to you shortly' })
    } catch (error) {
      console.error('Error exporting data:', error)
      setMessage({ type: 'error', text: 'Failed to export data' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Delete Account', icon: Trash2 }
  ]

  const languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'es' as Language, name: 'Español' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'de' as Language, name: 'Deutsch' },
    { code: 'zh' as Language, name: '中文' }
  ]

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md border-b border-white/20 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => window.history.back()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white hover:bg-white/30 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-white/70 mt-1">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Horizontal Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <nav className="flex flex-wrap gap-2 justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </motion.button>
                )
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === 'profile' && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-white mr-3" />
                <h2 className="text-xl font-bold text-white">Profile Information</h2>
              </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* User Details Display */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Name</p>
                          <p className="text-lg font-semibold text-white">
                            {profile?.name || 'No name set'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                          <Mail className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Email</p>
                          <p className="text-lg font-semibold text-white">
                            {user?.email || 'No email set'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                          <Phone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Phone Number</p>
                          <p className="text-lg font-semibold text-white">
                            {profile?.preferred_mpesa_number || 'No phone number set'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
                  <div className="flex items-center mb-6">
                    <Lock className="h-6 w-6 text-white mr-3" />
                    <h2 className="text-xl font-bold text-white">Change Password</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        >
                          {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        >
                          {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                          className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/50"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleChangePassword}
                      disabled={saving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-white rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 disabled:opacity-50 transition-all duration-300 border border-white/20 shadow-lg"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Update Password
                    </motion.button>
                  </div>
                </div>


              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <SettingsIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
                </div>

                <div className="space-y-8">
                  {/* Theme */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light' as Theme, label: 'Light', icon: Sun },
                        { value: 'dark' as Theme, label: 'Dark', icon: Moon },
                        { value: 'system' as Theme, label: 'System', icon: Monitor }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center ${
                            theme === value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Icon className="h-6 w-6 mb-2" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Language</h3>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Timezone</h3>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
                <div className="flex items-center mb-6">
                  <Bell className="h-6 w-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white">User Activity Logs</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div>
                            <h3 className="text-sm font-medium text-white">Report Created</h3>
                            <p className="text-xs text-white/60">New research report "Climate Analysis" created</p>
                          </div>
                        </div>
                        <span className="text-xs text-white/50">2 hours ago</span>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div>
                            <h3 className="text-sm font-medium text-white">Password Changed</h3>
                            <p className="text-xs text-white/60">Account password was updated successfully</p>
                          </div>
                        </div>
                        <span className="text-xs text-white/50">1 day ago</span>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <div>
                            <h3 className="text-sm font-medium text-white">Message Notification</h3>
                            <p className="text-xs text-white/60">New message received from system admin</p>
                          </div>
                        </div>
                        <span className="text-xs text-white/50">3 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <Lock className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Visibility</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
                        { value: 'institution', label: 'Institution Only', description: 'Only members of your institution can see your profile' },
                        { value: 'private', label: 'Private', description: 'Only you can see your profile' }
                      ].map(({ value, label, description }) => (
                        <label key={value} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="profile_visibility"
                            value={value}
                            checked={privacy.profile_visibility === value}
                            onChange={(e) => setPrivacy({ ...privacy, profile_visibility: e.target.value as 'public' | 'private' | 'institution' })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{label}</div>
                            <div className="text-sm text-gray-600">{description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Information Sharing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Information Sharing</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'show_email' as keyof PrivacySettings, label: 'Show email address', description: 'Allow others to see your email address' },
                        { key: 'show_institution' as keyof PrivacySettings, label: 'Show institution', description: 'Display your institution on your profile' },
                        { key: 'allow_collaboration' as keyof PrivacySettings, label: 'Allow collaboration requests', description: 'Let others invite you to collaborate on reports' },
                        { key: 'data_sharing' as keyof PrivacySettings, label: 'Anonymous data sharing', description: 'Help improve SciDraft by sharing anonymous usage data' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{label}</div>
                            <div className="text-sm text-gray-600">{description}</div>
                          </div>
                          <button
                            onClick={() => setPrivacy({ ...privacy, [key]: !privacy[key] })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              privacy[key] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                privacy[key] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">


                {/* Delete Account */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-red-400/20 p-8">
                  <div className="flex items-center mb-6">
                    <Trash2 className="h-6 w-6 text-red-400 mr-3" />
                    <h2 className="text-xl font-bold text-white">Delete Account</h2>
                  </div>

                  <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-300">Warning: This action cannot be undone</h3>
                        <p className="text-sm text-red-200 mt-1">
                          Deleting your account will permanently remove all your reports, data, and settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-sm text-white rounded-lg hover:from-red-500/30 hover:to-red-600/30 disabled:opacity-50 transition-all duration-300 border border-red-400/20 shadow-lg"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Account
                  </motion.button>
                </div>
              </div>
            )}
        </motion.div>
      </div>
    </div>
  )
}