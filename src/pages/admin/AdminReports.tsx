import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Report {
  id: string
  user_id: string
  title: string
  status: 'draft_limited' | 'full_report' | 'exported' | 'failed'
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

interface ReportAnalytics {
  totalReports: number
  draftReports: number
  fullReports: number
  exportedReports: number
  failedReports: number
  avgReportsPerUser: number
  reportsToday: number
  reportsThisWeek: number
  reportsThisMonth: number
}

export function AdminReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft_limited' | 'full_report' | 'exported' | 'failed'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)

  const itemsPerPage = 15

  useEffect(() => {
    fetchReports()
    fetchAnalytics()
    
    // Set up real-time subscription for reports
    const subscription = supabase
      .channel('reports')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports'
      }, () => {
        fetchReports()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, searchTerm, statusFilter, dateFilter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          users!inner(
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      // Format data with user info
      const reportsWithUserInfo: Report[] = reportsData?.map(report => ({
        ...report,
        user_email: report.users.email,
        user_name: report.users.name
      })) || []

      setReports(reportsWithUserInfo)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Get report counts by status
      const { data: reportCounts } = await supabase
        .from('reports')
        .select('status, created_at')

      if (!reportCounts) return

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const totalReports = reportCounts.length
      const draftReports = reportCounts.filter(r => r.status === 'draft_limited').length
      const fullReports = reportCounts.filter(r => r.status === 'full_report').length
      const exportedReports = reportCounts.filter(r => r.status === 'exported').length
      const failedReports = reportCounts.filter(r => r.status === 'failed').length
      
      const reportsToday = reportCounts.filter(r => 
        new Date(r.created_at) >= today
      ).length
      
      const reportsThisWeek = reportCounts.filter(r => 
        new Date(r.created_at) >= weekAgo
      ).length
      
      const reportsThisMonth = reportCounts.filter(r => 
        new Date(r.created_at) >= monthAgo
      ).length

      // Get active user count for average calculation
      const { data: activeUsers } = await supabase
        .from('users')
        .select('id')
        .neq('role', 'admin')
        .gte('last_login', monthAgo.toISOString())

      const avgReportsPerUser = activeUsers?.length ? 
        Math.round((reportsThisMonth / activeUsers.length) * 10) / 10 : 0

      setAnalytics({
        totalReports,
        draftReports,
        fullReports,
        exportedReports,
        failedReports,
        avgReportsPerUser,
        reportsToday,
        reportsThisWeek,
        reportsThisMonth
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const filterReports = () => {
    let filtered = reports

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let filterDate: Date
      
      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          filterDate = new Date(0)
      }
      
      filtered = filtered.filter(report => 
        new Date(report.created_at) >= filterDate
      )
    }

    setFilteredReports(filtered)
    setCurrentPage(1)
  }

  const handleViewReport = (reportId: string) => {
    // Navigate to report details page in admin context
    window.open(`/admin/reports/${reportId}`, '_blank')
  }

  const handleExportReport = async (reportId: string) => {
    try {
      setLoading(true)
      
      // Fetch the full report data
      const { data: reportData, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          draft_json,
          user:users(name, email)
        `)
        .eq('id', reportId)
        .single()

      if (error) {
        throw error
      }

      // Generate export content
      const exportContent = {
        report_info: {
          id: reportData.id,
          title: reportData.title,
          status: reportData.status,
          created_at: reportData.created_at,
          updated_at: reportData.updated_at
        },
        user_info: reportData.user,
        content: reportData.draft_json || {}
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportContent, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `report_${reportData.id}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('Report exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export report: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      // Refresh the reports list
      await fetchReports()
      await fetchAnalytics()
      
      alert('Report deleted successfully')
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report. Please try again.')
    } finally {
      setLoading(false)
      setShowDeleteModal(null)
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft_limited: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft Limited' },
      full_report: { color: 'bg-green-100 text-green-800', label: 'Full Report' },
      exported: { color: 'bg-blue-100 text-blue-800', label: 'Exported' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }



  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReports = filteredReports.slice(startIndex, endIndex)

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
          <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
          <p className="text-gray-600">Monitor and manage user reports</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalReports}</p>
                <p className="text-sm text-gray-600">Total Reports</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.exportedReports}</p>
                <p className="text-sm text-gray-600">Exported Reports</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.draftReports}</p>
                <p className="text-sm text-gray-600">Draft Reports</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgReportsPerUser}</p>
                <p className="text-sm text-gray-600">Avg per Active User</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time-based Analytics */}
      {analytics && (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-600">{analytics.reportsToday}</p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{analytics.reportsThisWeek}</p>
              <p className="text-sm text-gray-600">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{analytics.reportsThisMonth}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-black"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-black"
          >
            <option value="all">All Status</option>
            <option value="draft_limited">Draft Limited</option>
            <option value="full_report">Full Report</option>
            <option value="exported">Exported</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-black"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Title</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Created</th>
                <th className="text-right py-4 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">{report.title || 'Untitled Report'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{report.user_name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{report.user_email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleExportReport(report.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Export Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteModal(report.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Report"
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
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

      {/* Delete Report Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Report</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this report and all its associated data?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReport(showDeleteModal)}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}