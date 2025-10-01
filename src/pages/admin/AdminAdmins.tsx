import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminAuth, withAdminRole } from '../../contexts/AdminAuthContext'
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Shield,
  ShieldCheck,
  Clock,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  UserMinus,
  Settings,
  AlertTriangle,
  CheckCircle,
  X,
  Mail,
  Calendar,
  Activity,
  Crown,
  User as UserIcon
} from 'lucide-react'
import { User } from '../../lib/supabase'

interface AdminUser extends User {
  last_login?: string
  created_at: string
  session_expires_at?: string
}

interface NewAdminForm {
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
}

function AdminAdminsComponent() {
  const { admin } = useAdminAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'super_admin'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null)
  const [newAdmin, setNewAdmin] = useState<NewAdminForm>({
    email: '',
    fullName: '',
    role: 'admin'
  })
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super_admin'>('admin')
  const [processing, setProcessing] = useState(false)
  const [sessionTimeouts, setSessionTimeouts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchAdmins()
    // Set up session timeout monitoring
    const interval = setInterval(updateSessionTimeouts, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admin', 'super_admin'])
        .order('created_at', { ascending: false })

      if (error) throw error

      setAdmins(data || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSessionTimeouts = () => {
    const timeouts: Record<string, number> = {}
    admins.forEach(admin => {
      if (admin.session_expires_at) {
        const expiresAt = new Date(admin.session_expires_at).getTime()
        const now = Date.now()
        const remaining = Math.max(0, expiresAt - now)
        timeouts[admin.id] = remaining
      }
    })
    setSessionTimeouts(timeouts)
  }

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.fullName) {
      alert('Please fill in all required fields')
      return
    }

    setProcessing(true)
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', newAdmin.email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingUser) {
        if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
          alert('User is already an admin')
          return
        }
        
        // Update existing user to admin
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: newAdmin.role })
          .eq('id', existingUser.id)

        if (updateError) throw updateError
      } else {
        // Create new admin user (this would typically be done through auth signup)
        alert('Please use the standard signup process first, then promote the user to admin')
        return
      }

      await fetchAdmins()
      setShowAddModal(false)
      setNewAdmin({ email: '', fullName: '', role: 'admin' })
    } catch (error) {
      console.error('Error adding admin:', error)
      alert('Failed to add admin. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (adminId === admin?.id) {
      alert('You cannot remove yourself as an admin')
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'student' })
        .eq('id', adminId)

      if (error) throw error

      await fetchAdmins()
      setShowDeleteModal(null)
    } catch (error) {
      console.error('Error removing admin:', error)
      alert('Failed to remove admin. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleChangeRole = async (adminId: string) => {
    if (adminId === admin?.id && selectedRole !== admin.role.toLowerCase().replace(' ', '_')) {
      alert('You cannot change your own role')
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', adminId)

      if (error) throw error

      await fetchAdmins()
      setShowRoleModal(null)
    } catch (error) {
      console.error('Error changing role:', error)
      alert('Failed to change role. Please try again.')
    } finally {
      setProcessing(false)
    }
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

  const formatSessionTimeout = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-red-100 text-red-700'
      case 'Content Admin':
        return 'bg-blue-100 text-blue-700'
      case 'Support Admin':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return Crown
      case 'Content Admin':
        return Shield
      case 'Support Admin':
        return UserIcon
      default:
        return UserIcon
    }
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    return matchesSearch && matchesRole
  })

  const isSuperAdmin = admin?.role === 'Super Admin'

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
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage admin users and permissions</p>
        </div>
        
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Security Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              Admin sessions automatically expire after 30 minutes of inactivity for security purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAdmins.map((adminUser) => {
                const RoleIcon = getRoleIcon(adminUser.role)
                  const sessionRemaining = sessionTimeouts[adminUser.id]
                  const isSessionActive = sessionRemaining && sessionRemaining > 0
                
                return (
                  <tr key={adminUser.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {adminUser.name?.charAt(0) || adminUser.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {adminUser.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{adminUser.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <RoleIcon className="w-4 h-4" />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(adminUser.role)}`}>
                          {adminUser.role}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Activity className="w-4 h-4" />
                        <span>
                          {adminUser.last_login ? formatDate(adminUser.last_login) : 'Never'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSessionActive ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600 font-medium">
                            Active ({formatSessionTimeout(sessionRemaining)})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">Inactive</span>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(adminUser.created_at)}</span>
                      </div>
                    </td>
                    
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {adminUser.id !== admin?.id && (
                            <>
                              <button
                                onClick={() => {
                                  setShowRoleModal(adminUser.id)
                                  setSelectedRole(adminUser.role as 'admin' | 'super_admin')
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Change Role"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteModal(adminUser.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove Admin"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {adminUser.id === admin?.id && (
                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
            <p className="text-gray-600">No admins match your current filters.</p>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Admin</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as 'admin' | 'super_admin' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Admin Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <UserMinus className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Remove Admin</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove this admin? They will be converted back to a regular user.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> This action cannot be undone. The user will lose all admin privileges.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveAdmin(showDeleteModal)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Removing...' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Change Role</h3>
              </div>
              <button
                onClick={() => setShowRoleModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Select the new role for this admin:
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={selectedRole === 'admin'}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Admin</div>
                      <div className="text-sm text-gray-600">Standard admin privileges</div>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="super_admin"
                    checked={selectedRole === 'super_admin'}
                    onChange={(e) => setSelectedRole(e.target.value as 'super_admin')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900">Super Admin</div>
                      <div className="text-sm text-gray-600">Full system access and control</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowRoleModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleChangeRole(showRoleModal)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export with Super Admin role protection (Vanessa equivalent)
export const AdminAdmins = withAdminRole(AdminAdminsComponent, { requiredRole: 'Super Admin' })