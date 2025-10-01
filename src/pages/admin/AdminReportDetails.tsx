import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Download, Eye, FileText, User, Calendar, Clock } from 'lucide-react'

interface ReportDetails {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  draft_json?: any
  user: {
    id: string
    name: string
    email: string
  }
  practical: {
    id: string
    title: string
    unit: {
      subject: string
      code: string
    }
  }
}

const AdminReportDetails: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reportId) {
      fetchReportDetails()
    }
  }, [reportId])

  const fetchReportDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          draft_json,
          user:users(id, name, email),
          practical:practicals(
            id,
            title,
            unit:units(subject, code)
          )
        `)
        .eq('id', reportId)
        .single()

      if (error) {
        throw error
      }

      // Fix the user and practical data structure - Supabase returns arrays for relations
      const practical = Array.isArray(data.practical) ? data.practical[0] : data.practical
      const reportData = {
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user,
        practical: practical ? {
          ...practical,
          unit: Array.isArray(practical.unit) ? practical.unit[0] : practical.unit
        } : null
      }
      setReport(reportData)
    } catch (error: any) {
      console.error('Error fetching report details:', error)
      setError(error.message || 'Failed to load report details')
      alert('Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      alert('Export functionality will be implemented soon')
      // TODO: Implement export functionality
    } catch (error: any) {
      console.error('Export error:', error)
      alert('Failed to export report')
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report details...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested report could not be found.'}</p>
          <button
            onClick={() => navigate('/admin/reports')}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/reports')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
              <p className="text-gray-600 mt-1">Report ID: {report.id}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(report.status)}
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Report Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Content</h2>
              
              {report.draft_json ? (
                <div className="space-y-6">
                  {Object.entries(report.draft_json).map(([section, content]) => (
                    <div key={section} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">
                        {section.replace(/_/g, ' ')}
                      </h3>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No content available for this report.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{report.user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{report.user.email}</p>
                </div>
              </div>
            </div>

            {/* Practical Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Practical Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Title</p>
                  <p className="text-gray-900">{report.practical.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p className="text-gray-900">{report.practical.unit.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit Code</p>
                  <p className="text-gray-900">{report.practical.unit.code}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Timestamps
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-gray-900 text-sm">{formatDate(report.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-gray-900 text-sm">{formatDate(report.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminReportDetails