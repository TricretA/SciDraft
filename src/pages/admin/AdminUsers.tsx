import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserX,
  Trash2,
  Calendar,
  Mail,
  Phone,
  FileText,
  CreditCard,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react'
import { User } from '../../lib/supabase'

interface UserWithStats extends User {
  reports_count: number
  last_payment_date?: string
  total_spent: number
  feedbacks_count: number
}

interface UserDetail {
  user: UserWithStats
  reports: any[]
  payments: any[]
  feedbacks: any[]
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'lecturer'>('all')
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
    
    // Set up real-time subscription for users
    const subscription = supabase
      .channel('users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        fetchUsers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, planFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Fetch users with stats
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          reports:reports(count),
          payments:payments(amount, created_at, status),
          feedbacks:feedback(count)
        `)
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersWithStats: UserWithStats[] = usersData?.map(user => {
        const successfulPayments = user.payments?.filter(p => p.status === 'success') || []
        const totalSpent = successfulPayments.reduce((sum, p) => sum + p.amount, 0)
        const lastPaymentDate = successfulPayments.length > 0 
          ? successfulPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : undefined

        return {
          ...user,
          reports_count: user.reports?.[0]?.count || 0,
          total_spent: totalSpent,
          last_payment_date: lastPaymentDate,
          feedbacks_count: user.feedbacks?.[0]?.count || 0
        }
      }) || []

      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.includes(searchTerm)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(user => user.active_plan === planFilter)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      // Fetch detailed reports
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Fetch payment history
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Fetch feedbacks
      const { data: feedbacks } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setSelectedUser({
        user,
        reports: reports || [],
        payments: payments || [],
        feedbacks: feedbacks || []
      })
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active_plan: 'suspended' })
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
      setShowSuspendModal(null)
    } catch (error) {
      console.error('Error suspending user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user data in order (due to foreign key constraints)
      await supabase.from('feedback').delete().eq('user_id', userId)
      await supabase.from('exports').delete().eq('user_id', userId)
      await supabase.from('payments').delete().eq('user_id', userId)
      await supabase.from('reports').delete().eq('user_id', userId)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
      setShowDeleteModal(null)
      if (selectedUser?.user.id === userId) {
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      premium: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[plan as keyof typeof colors] || colors.free
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      lecturer: 'bg-purple-100 text-purple-800'
    }
    return colors[role as keyof typeof colors] || colors.student
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (selectedUser) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600">{selectedUser.user.email}</p>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <p className="font-medium">{selectedUser.user.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Role</span>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(selectedUser.user.role)}`}>
                {selectedUser.user.role}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Join Date</span>
              </div>
              <p className="font-medium">{formatDate(selectedUser.user.created_at)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Phone</span>
              </div>
              <p className="font-medium">{selectedUser.user.preferred_mpesa_number || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedUser.reports.length}</p>
                <p className="text-sm text-gray-600">Reports Created</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedUser.user.total_spent)}</p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedUser.feedbacks.length}</p>
                <p className="text-sm text-gray-600">Feedbacks Given</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports History */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports History</h3>
          {selectedUser.reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reports created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Report ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.reports.slice(0, 10).map((report) => (
                    <tr key={report.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-mono">{report.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === 'exported' ? 'bg-green-100 text-green-800' :
                          report.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(report.created_at)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{report.subject || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          {selectedUser.payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payments made yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Payment ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-mono">{payment.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'success' ? 'bg-green-100 text-green-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and monitor user accounts</p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/settings'}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="Admin Settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-black"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'student' | 'lecturer')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-black"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Lecturers</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as 'all' | 'free' | 'premium')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-black"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Role</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Plan</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Reports</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Last Login</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Joined</th>
                <th className="text-right py-4 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{user.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.active_plan)}`}>
                      {user.active_plan}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900">{user.reports_count}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => fetchUserDetails(user.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowSuspendModal(user.id)}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Suspend User"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suspend User Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Suspend User</h3>
                <p className="text-sm text-gray-600">This action will suspend the user's account</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to suspend this user? They will lose access to premium features.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuspendModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspendUser(showSuspendModal)}
                className="flex-1 px-4 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this user and all their data? This includes reports, payments, and feedback.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteModal)}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}