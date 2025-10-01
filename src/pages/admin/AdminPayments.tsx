import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DollarSign,
  Calendar,
  BarChart3,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Phone,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Payment {
  id: string
  user_id: string
  user_email: string
  user_name?: string
  amount: number
  phone_number: string
  status: 'pending' | 'success' | 'failed'
  transaction_id?: string
  created_at: string
}

interface PaymentAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  avgPaymentAmount: number
  totalPayments: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  successRate1Day: number
  successRate7Days: number
  successRate30Days: number
  failureRate1Day: number
  failureRate7Days: number
  failureRate30Days: number
}

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
    fetchAnalytics()
    
    // Set up real-time subscription for payments
    const subscription = supabase
      .channel('payments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments'
      }, () => {
        fetchPayments()
        fetchAnalytics()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users!inner(
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedPayments = data.map(payment => ({
        ...payment,
        user_email: payment.users.email,
        user_name: payment.users.full_name
      }))

      setPayments(formattedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')

      if (error) throw error

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const totalRevenue = paymentsData
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0)

      const monthlyRevenue = paymentsData
        .filter(p => p.status === 'success' && new Date(p.created_at) >= monthStart)
        .reduce((sum, p) => sum + p.amount, 0)

      const successfulPayments = paymentsData.filter(p => p.status === 'success').length
      const failedPayments = paymentsData.filter(p => p.status === 'failed').length
      const pendingPayments = paymentsData.filter(p => p.status === 'pending').length

      const payments1Day = paymentsData.filter(p => new Date(p.created_at) >= oneDayAgo)
      const payments7Days = paymentsData.filter(p => new Date(p.created_at) >= sevenDaysAgo)
      const payments30Days = paymentsData.filter(p => new Date(p.created_at) >= thirtyDaysAgo)

      const successRate1Day = payments1Day.length > 0 
        ? Math.round((payments1Day.filter(p => p.status === 'success').length / payments1Day.length) * 100)
        : 0
      const successRate7Days = payments7Days.length > 0
        ? Math.round((payments7Days.filter(p => p.status === 'success').length / payments7Days.length) * 100)
        : 0
      const successRate30Days = payments30Days.length > 0
        ? Math.round((payments30Days.filter(p => p.status === 'success').length / payments30Days.length) * 100)
        : 0

      const failureRate1Day = payments1Day.length > 0
        ? Math.round((payments1Day.filter(p => p.status === 'failed').length / payments1Day.length) * 100)
        : 0
      const failureRate7Days = payments7Days.length > 0
        ? Math.round((payments7Days.filter(p => p.status === 'failed').length / payments7Days.length) * 100)
        : 0
      const failureRate30Days = payments30Days.length > 0
        ? Math.round((payments30Days.filter(p => p.status === 'failed').length / payments30Days.length) * 100)
        : 0

      setAnalytics({
        totalRevenue,
        monthlyRevenue,
        avgPaymentAmount: paymentsData.length > 0 ? totalRevenue / successfulPayments : 0,
        totalPayments: paymentsData.length,
        successfulPayments,
        failedPayments,
        pendingPayments,
        successRate1Day,
        successRate7Days,
        successRate30Days,
        failureRate1Day,
        failureRate7Days,
        failureRate30Days
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

      setPayments(payments.filter(p => p.id !== paymentId))
      setShowDeleteModal(null)
      fetchAnalytics() // Refresh analytics
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
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

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.phone_number.includes(searchTerm) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const paymentDate = new Date(payment.created_at)
      const now = new Date()
      
      switch (dateFilter) {
        case 'today':
          matchesDate = paymentDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      success: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    }
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    )
  }

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = filteredPayments.slice(startIndex, endIndex)

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
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Monitor payments and revenue</p>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.monthlyRevenue)}</p>
                <p className="text-sm text-gray-600">This Month</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.avgPaymentAmount)}</p>
                <p className="text-sm text-gray-600">Avg Payment</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalPayments}</p>
                <p className="text-sm text-gray-600">Total Payments</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Failure Rates */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Rates */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Success Rates</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 24 hours</span>
                <span className="text-lg font-bold text-green-600">{analytics.successRate1Day}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 7 days</span>
                <span className="text-lg font-bold text-green-600">{analytics.successRate7Days}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 30 days</span>
                <span className="text-lg font-bold text-green-600">{analytics.successRate30Days}%</span>
              </div>
            </div>
          </div>

          {/* Failure Rates */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Failure Rates</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 24 hours</span>
                <span className="text-lg font-bold text-red-600">{analytics.failureRate1Day}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 7 days</span>
                <span className="text-lg font-bold text-red-600">{analytics.failureRate7Days}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 30 days</span>
                <span className="text-lg font-bold text-red-600">{analytics.failureRate30Days}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Overview */}
      {analytics && (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.successfulPayments}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{analytics.failedPayments}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analytics.pendingPayments}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {filteredPayments.length} of {payments.length} payments
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Payment ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Amount</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Phone</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Date</th>
                <th className="text-right py-4 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-4 px-6">
                    <div>
                      <span className="font-mono text-sm">{payment.id.slice(0, 8)}...</span>
                      {payment.transaction_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Txn: {payment.transaction_id.slice(0, 12)}...
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{payment.user_name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{payment.user_email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{payment.phone_number}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {formatDate(payment.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setShowDeleteModal(payment.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Payment"
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
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

      {/* Delete Payment Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Payment</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this payment record?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePayment(showDeleteModal)}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPayments