import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FeedbackButton } from '../components/FeedbackButton'
import { useReportStore } from '../stores/reportStore'
import { SuccessNotification } from '../components/SuccessNotification'
import {
  ArrowLeft,
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  CreditCard,
  Phone,
  X
} from 'lucide-react'
import html2pdf from 'html2pdf.js'

interface DraftData {
  id: string;
  session_id: string;
  user_id: string;
  draft: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPayment: (phoneNumber: string) => void
  loading: boolean
}

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: string
}

function PaymentModal({ isOpen, onClose, onPayment, loading }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }
    if (!/^254\d{9}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      setError('Please enter a valid Kenyan phone number (254XXXXXXXXX)')
      return
    }
    setError('')
    onPayment(phoneNumber)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Required</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-white/80 mb-4">
              To access the full report, please pay Ksh 50 via M-Pesa.
            </p>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-4">
              <p className="text-green-300 font-semibold">Amount: Ksh 50</p>
              <p className="text-white/70 text-sm mt-1">Secure payment via M-Pesa STK Push</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254XXXXXXXXX"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Pay Ksh 50</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function FeedbackModal({ isOpen, onClose, sessionId }: FeedbackModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Download Complete!</h3>
            <p className="text-white/80 mb-6">
              Your report has been downloaded successfully. We'd love to hear your feedback!
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  onClose()
                  window.location.href = `/feedback?reportId=${sessionId || ''}`
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Star className="h-4 w-4" />
                <span>Give Feedback</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function DraftViewer() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { getReportData, loadFromSessionStorage, validateReportData } = useReportStore()
  const [draftData, setDraftData] = useState<DraftData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Defensive programming: ensure store methods are available
  if (!getReportData || !loadFromSessionStorage || !validateReportData) {
    console.error('Report store methods not available')
    setError('System configuration error: Report store not properly initialized')
    setLoading(false)
    return
  }
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [generatingFullReport, setGeneratingFullReport] = useState(false)
  const [fullReportGenerated, setFullReportGenerated] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 5

  // Authentication is optional for draft viewing
  // Users can view drafts without being logged in

  // Load draft data
  useEffect(() => {
    if (sessionId) {
      loadDraftData()
    }
  }, [sessionId])

  // Exponential backoff utility
  const exponentialBackoff = async (fn: () => Promise<any>, maxRetries: number = 5): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s, 8s, 16s
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  const loadDraftData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const result = await exponentialBackoff(async () => {
        const { data, error } = await supabase
          .from('drafts')
          .select('id, session_id, user_id, draft, status, created_at, updated_at')
          .eq('session_id', sessionId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned - draft might still be processing
            throw new Error('Draft not found or still processing')
          }
          throw error
        }
        
        return data
      }, maxRetries)

      if (!result) {
        throw new Error('Draft not found')
      }

      setDraftData(result)
      
      // Check if a full report already exists for this session
      try {
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('id')
          .eq('session_id', sessionId)
          .single()
        
        if (reportData && !reportError) {
          setFullReportGenerated(true)
          console.log('Full report already exists for this session')
        }
      } catch (reportCheckError) {
        // No report exists yet, which is fine
        console.log('No full report exists yet for this session')
      }
      
      // If draft is still pending, set up polling
      if (result.status === 'pending') {
        setTimeout(() => {
          if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1)
            loadDraftData()
          } else {
            setError('Draft generation is taking longer than expected. Please try refreshing the page.')
          }
        }, 3000) // Poll every 3 seconds
      }
      
    } catch (err: any) {
      console.error('Error loading draft:', err)
      if (retryCount < maxRetries && err.message.includes('still processing')) {
        // If it's still processing, show a different message and retry
        setError('Draft is being generated, please wait...')
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadDraftData()
        }, 5000)
      } else {
        setError(err.message || 'Failed to load draft')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true)
      const element = document.getElementById('draft-content')
      
      if (!element) {
        throw new Error('Draft content not found')
      }
      
      const opt = {
        margin: 0.5,
        filename: 'sci-draft.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      }
      
      await html2pdf().set(opt).from(element).save()
      setShowFeedbackModal(true)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleGetFullReport = async () => {
    try {
      setGeneratingFullReport(true)
      await generateFullReport()
      setFullReportGenerated(true)
      setShowSuccessNotification(true)
    } catch (err: any) {
      console.error('Error generating full report:', err)
      
      // Provide user-friendly error messages based on error type
      let userMessage = 'Failed to generate full report. Please try again.'
      
      if (err.message.includes('Draft data is not available')) {
        userMessage = 'Session expired. Please refresh the page and try again.'
      } else if (err.message.includes('No manual content available')) {
        userMessage = 'Original manual data is missing. Please return to the report creation page and re-upload your manual.'
      } else if (err.message.includes('System prompts not found')) {
        userMessage = 'System configuration error. Please contact support.'
      } else if (err.message.includes('API request failed')) {
        userMessage = 'Server error occurred. Please try again in a few moments.'
      } else if (err.message.includes('Unable to retrieve report data')) {
        userMessage = 'Could not access your report data. Please return to the report creation page and start over.'
      }
      
      setError(userMessage)
    } finally {
      setGeneratingFullReport(false)
    }
  }

  const handleViewFullReport = () => {
    setShowPaymentModal(true)
  }

  const handlePayment = async (phoneNumber: string) => {
    try {
      setPaymentLoading(true)
      
      // Simulate payment processing (always successful in development)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setShowPaymentModal(false)
      // Navigate to report viewer or show full report content
      navigate(`/report-viewer/${sessionId}`)
    } catch (err: any) {
      console.error('Payment error:', err)
      setError('Payment failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const generateFullReport = async () => {
    try {
      if (!draftData) {
        throw new Error('Draft data is not available. Please refresh the page and try again.')
      }

      let originalData = {
        parsedText: '',
        results: '',
        images: [],
        subject: 'Biology'
      }
      
      let dataSource = 'none'
      
      try {
        // Get stored data from global state first
        const storedData = getReportData()
        console.log('Retrieved stored data from global state:', storedData)
        
        // Use stored data if available and valid
         if (storedData && validateReportData(storedData) && (storedData.manualText || storedData.parsedContent)) {
           console.log('Using validated stored data from global state')
           originalData = {
             parsedText: storedData.manualText || storedData.parsedContent || '',
             results: storedData.resultsJson ? JSON.stringify(storedData.resultsJson) : '',
             images: storedData.userInputs?.images || [],
             subject: storedData.userInputs?.subject || 'Biology'
           }
           dataSource = 'global_state'
        } else {
          console.log('No valid stored data found, attempting to retrieve from session storage')
          
          // Try to get from session storage as fallback
          try {
            const sessionStorageData = loadFromSessionStorage()
             if (sessionStorageData && validateReportData(sessionStorageData) && (sessionStorageData.manualText || sessionStorageData.parsedContent)) {
               console.log('Using validated data from session storage')
               originalData = {
                 parsedText: sessionStorageData.manualText || sessionStorageData.parsedContent || '',
                 results: sessionStorageData.resultsJson ? JSON.stringify(sessionStorageData.resultsJson) : '',
                 images: sessionStorageData.userInputs?.images || [],
                 subject: sessionStorageData.userInputs?.subject || 'Biology'
               }
               dataSource = 'session_storage'
            }
          } catch (sessionError) {
            console.warn('Failed to load from session storage:', sessionError)
          }
        }
      } catch (stateError) {
        console.warn('Error accessing global state:', stateError)
      }
      
      // If no data found in global state or session storage, try database as last resort
      if (dataSource === 'none') {
        console.log('No stored data available, attempting to retrieve from database as last resort')
        try {
          // Last resort: try to get from database (original logic)
          console.log('Attempting to retrieve from database as last resort')
          const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', draftData.session_id)
            .single()

          if (sessionError || !sessionData) {
            throw new Error('Session data not found in database')
          }

          // Parse the draft content to extract original data
          const draftContent = JSON.parse(draftData.draft || '{}')
          originalData = {
            parsedText: sessionData.parsed_text || '',
            results: sessionData.results || '',
            images: sessionData.images || [],
            subject: draftContent.subject || sessionData.subject || 'Biology'
          }
          dataSource = 'database'
          console.log('Successfully retrieved data from database')
        } catch (dbError) {
          console.error('Failed to retrieve data from database:', dbError)
          throw new Error(`Unable to retrieve report data from any source. Database error: ${dbError.message}`)
        }
      }

      // Validate that we have the necessary data
      if (!originalData.parsedText || originalData.parsedText.trim() === '') {
        const errorMsg = `No manual content available from ${dataSource}. Please return to the report creation page and re-upload your manual to ensure proper data storage.`
        console.error('Data validation failed:', { dataSource, originalData })
        throw new Error(errorMsg)
      }
      
      console.log(`Successfully validated data from ${dataSource}:`, {
        hasText: !!originalData.parsedText,
        hasResults: !!originalData.results,
        imageCount: originalData.images?.length || 0,
        subject: originalData.subject
      })
      
      if (!originalData.results.trim()) {
        const proceed = confirm(
          '⚠️ No results data found in the original session.\n\n' +
          'The full report will be generated based on the manual content only. ' +
          'For a complete report, you may want to create a new report with your results included.\n\n' +
          'Would you like to proceed anyway?'
        )
        
        if (!proceed) {
          throw new Error('Full report generation cancelled. Results data is required for a complete report.')
        }
      }

      // Get subject-specific prompts with error handling
      let promptData
      try {
        const { data, error: promptError } = await supabase
          .from('prompts')
          .select('prompt_text, subject')
          .eq('subject', originalData.subject.toLowerCase())
          .single()

        if (promptError) {
          throw new Error(`Failed to retrieve prompts: ${promptError.message}`)
        }

        if (!data) {
          throw new Error(`System prompts not found for subject: ${originalData.subject}`)
        }
        
        promptData = data
        console.log('Successfully retrieved system prompts for:', originalData.subject)
      } catch (promptErr) {
        console.error('Prompt retrieval error:', promptErr)
        throw new Error(`Unable to retrieve system prompts: ${promptErr.message}`)
      }

      // Compile the data for full report generation
      const fullReportData = {
        parsedText: originalData.parsedText,
        results: originalData.results,
        images: originalData.images,
        subject: originalData.subject,
        prompt: String(promptData.prompt_text || ''),
        sessionId: sessionId || 'default-session',
        manualContent: originalData.parsedText
      }

      console.log('Sending data for full report generation:', {
        hasText: !!fullReportData.parsedText,
        hasResults: !!fullReportData.results,
        imageCount: fullReportData.images?.length || 0,
        subject: fullReportData.subject,
        hasPrompt: !!fullReportData.prompt,
        sessionId: fullReportData.sessionId
      })

      // Generate full report with comprehensive error handling
      let result
      try {
        const response = await fetch('/api/generate-full-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fullReportData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API request failed (${response.status}): ${errorText}`)
        }

        result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'API returned unsuccessful response')
        }
        
        if (!result.content) {
          throw new Error('API response missing full report content')
        }
        
        console.log('Successfully generated full report')
      } catch (apiError) {
        console.error('Full report generation API error:', apiError)
        throw new Error(`Failed to generate full report: ${apiError.message}`)
      }

      // Save the full report to the reports table
      try {
        const { error: insertError } = await supabase
          .from('reports')
          .insert({
            user_id: draftData.user_id,
            session_id: draftData.session_id,
            content: result.content, // Store directly as string, no JSON.stringify needed
            subject: originalData.subject,
            metadata: {
              generated_from_draft_id: draftData.id,
              original_data_source: dataSource,
              generation_timestamp: new Date().toISOString()
            }
          })

        if (insertError) {
          throw new Error(`Failed to save full report: ${insertError.message}`)
        }
        
        console.log('Successfully saved full report to reports table')
      } catch (saveError) {
        console.error('Save error:', saveError)
        throw new Error(`Generated report but failed to save: ${saveError.message}`)
      }

      // Reload the draft data to show the updated content
      await loadDraftData()
      
      console.log('Full report generated successfully')

    } catch (err: any) {
      console.error('Error generating full report:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Loading draft...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Draft</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-reports')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
          >
            Back to My Reports
          </button>
        </div>
      </div>
    )
  }

  if (!draftData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-white/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Draft Not Found</h2>
          <p className="text-white/70 mb-4">The requested draft could not be found.</p>
          <button
            onClick={() => navigate('/my-reports')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
          >
            Back to My Reports
          </button>
        </div>
      </div>
    )
  }

  if (!draftData.draft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-white/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Draft Content Empty</h2>
          <p className="text-white/70 mb-4">The draft content is not available yet.</p>
          <button
            onClick={() => navigate('/my-reports')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200"
          >
            Back to My Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/my-reports')}
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to My Reports</span>
            </button>
            <h1 className="text-xl font-bold text-white">Draft Viewer</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Draft Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Science Lab Report Draft</h2>
              <p className="text-white/60 text-sm">
                Generated on {new Date(draftData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Draft Content Display */}
          <div id="draft-content" className="p-4 bg-white">
            <div className="prose max-w-none text-gray-900">
              {draftData.draft ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Science Lab Report Draft</h1>
                    <p className="text-gray-600 text-sm">
                      Generated on {new Date(draftData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {(() => {
                    try {
                      // Try to parse as JSON first
                      const parsedDraft = JSON.parse(draftData.draft)
                      if (typeof parsedDraft === 'object' && parsedDraft !== null) {
                        return Object.entries(parsedDraft).map(([section, content]) => (
                          <div key={section} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 capitalize">
                              {section.replace(/_/g, ' ')}
                            </h3>
                            <div className="text-gray-800 whitespace-pre-wrap">
                              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                            </div>
                          </div>
                        ))
                      }
                    } catch (e) {
                      // If not JSON, display as plain text
                    }
                    
                    return (
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {draftData.draft}
                      </div>
                    )
                  })()} 
                </div>
              ) : draftData.status === 'pending' ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <div className="text-gray-600">Generating your draft...</div>
                  <div className="text-sm text-gray-500 mt-2">This may take a few moments</div>
                </div>
              ) : draftData.status === 'failed' ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">❌ Draft generation failed</div>
                  <div className="text-gray-600">Please try generating a new draft</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-600">No draft content available</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-amber-300 mb-2">Important Instructions</h3>
              <p className="text-white/80 leading-relaxed">
                This draft is only a guide to help you structure your lab report. You must input your actual experimental results, 
                observations, and data. Use this as a template and replace all placeholder content with your real findings.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
          >
            {downloadingPDF ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {!fullReportGenerated ? (
            <button
              onClick={handleGetFullReport}
              disabled={generatingFullReport}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
            >
              {generatingFullReport ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  <span>Get Full Report</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleViewFullReport}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            >
              <FileText className="h-5 w-5" />
              <span>View Full Report</span>
            </button>
          )}
        </motion.div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPayment={handlePayment}
        loading={paymentLoading}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        sessionId={sessionId}
      />
      
      {/* Success Notification */}
      <SuccessNotification
        isOpen={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        onViewReport={() => {
          setShowSuccessNotification(false)
          handleViewFullReport()
        }}
      />
      
      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  )
}