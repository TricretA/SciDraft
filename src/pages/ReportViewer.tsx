import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

import { ReportRenderer } from '../components/ReportRenderer'
// Removed ReactMarkdown - using same display method as drafts
import {
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle,
  Star,
  AlertCircle,
  FileText
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2pdf from 'html2pdf.js'

interface ReportData {
  id: string
  title?: string
  content: string
  metadata: any
  created_at: string
  updated_at: string
  subject?: string
  session_id?: string
  user_id?: string
  draft_json?: any
}



export function ReportViewer() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  // Authentication guard - TEMPORARILY DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     navigate('/login', { replace: true })
  //   }
  // }, [user, authLoading, navigate])

  // Load report data - MODIFIED FOR DEBUGGING (removed user dependency)
  useEffect(() => {
    if (id) {
      loadReportData()
    }
  }, [id])

  const loadReportData = async () => {
    console.log('🔍 ReportViewer - loadReportData called with ID:', id)
    
    if (!id) {
      console.log('🔍 ReportViewer - No ID provided')
      setError('No report ID provided')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔍 ReportViewer - Starting database query for session_id:', id)

      // Query by session_id since that's what's passed in the URL
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('session_id', id)
        .single()

      console.log('🔍 ReportViewer - Database query result:', { data, error })

      if (error) {
        console.error('🔍 ReportViewer - Database error:', error)
        throw error
      }

      if (!data) {
        console.log('🔍 ReportViewer - No data returned from database')
        throw new Error('Report not found or you do not have permission to view it')
      }

      // Map database columns to expected format
      const mappedData = {
        ...data,
        title: data.subject || 'Scientific Report', // Use subject as title fallback
        draft_json: data.content // Use content directly from reports table
      }
      
      console.log('🔍 ReportViewer - Raw report data from DB:', data)
      console.log('🔍 ReportViewer - Mapped report data:', mappedData)
      console.log('🔍 ReportViewer - draft_json type:', typeof mappedData.draft_json)
      console.log('🔍 ReportViewer - draft_json content:', mappedData.draft_json)
      
      setReportData(mappedData)
      console.log('🔍 ReportViewer - Report data set successfully')
    } catch (err: any) {
      console.error('🔍 ReportViewer - Failed to load report:', err)
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
      console.log('🔍 ReportViewer - Loading finished')
    }
  }



  const downloadFullReportPDF = async () => {
    if (!reportData) return

    try {
      // Get the report content element
      const reportElement = document.getElementById('report-content')
      if (!reportElement) {
        console.error('Report content element not found')
        return
      }

      // Ensure all content is visible and loaded before PDF generation
      // Wait for any lazy-loaded content or images
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Configure html2pdf options for complete content capture
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number], // top, left, bottom, right in inches
        filename: `${reportData.title || 'full-report'}-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          height: reportElement.scrollHeight, // Ensure full height is captured
          width: reportElement.scrollWidth,   // Ensure full width is captured
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Better page break handling
      }

      // Generate and download PDF
      await html2pdf().set(options).from(reportElement).save()
      
      // Show feedback overlay after download
      setTimeout(() => setShowFeedbackModal(true), 500)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Report</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <div className="flex space-x-4 justify-center">
              <button
                onClick={() => navigate('/new-report')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
              >
                Back to New Report
              </button>
            <button
              onClick={() => navigate(`/draft-viewer/${id}`)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
            >
              Back to Draft
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-white/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report Not Found</h2>
          <p className="text-white/70 mb-4">The requested report could not be found.</p>
              <button
                onClick={() => navigate('/new-report')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
              >
                Back to New Report
              </button>
        </div>
      </div>
    )
  }

  // Utility for rendering list sections
  const renderList = (items: string[]) => (
    <ul className="list-disc pl-6 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(`/`)}
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Draft</span>
            </button>
            <h1 className="text-xl font-bold text-white">Full Report</h1>
            <div className="w-16"></div> {/* Spacer for layout balance */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{reportData.title}</h2>
                <p className="text-white/60 text-sm">
                  Created: {new Date(reportData.created_at).toLocaleDateString()} • 
                  Updated: {new Date(reportData.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

          </div>

          {/* Report Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div id="report-content" className="p-8">
              <ReportRenderer 
                content={reportData.draft_json || reportData.content}
              />
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Remember</h3>
              <p className="text-white/80 leading-relaxed">
                Always input your real experimental results, observations, and data. 
                This AI-generated content should be customized with your actual findings and analysis.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Download Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <button
            onClick={downloadFullReportPDF}
            className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
          >
            <Download className="h-5 w-5" />
            <span>Download Full Report (PDF)</span>
          </button>
        </motion.div>
      </div>

      
    </div>
  )
}
