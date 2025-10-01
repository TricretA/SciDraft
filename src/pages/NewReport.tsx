import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useReportStore } from '../stores/reportStore'
import * as pdfjsLib from 'pdfjs-dist'
// Important: add ?url so Vite treats this as a file URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileText, 
  Clock, 
  Plus,
  Upload,
  Save,
  Loader2,
  Play,
  BookOpen, 
  Beaker, 
  Atom, 
  Microscope,
  Sparkles,
  Image,
  X,
  CheckCircle
} from 'lucide-react'

type Section = 'subject' | 'manual' | 'results'

interface NewReportState {
  subject: string
  unitName: string
  practicalTitle: string
  practicalNumber: number | string
  uploadedFile: File | null
  parsedData: any
  results: string
}

const subjects = [
  {
    id: 'biology',
    name: 'Biology',
    description: 'Molecular Biology, Genetics, Ecology, and Physiology studies',
    icon: Microscope,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-500/25'
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Analytical, Organic, Inorganic, and Physical Chemistry experiments',
    icon: Beaker,
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    glowColor: 'shadow-blue-500/25'
  },
  {
    id: 'physics',
    name: 'Physics',
    description: 'Mechanics, Thermodynamics, Optics, and Quantum Physics experiments',
    icon: Atom,
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    glowColor: 'shadow-violet-500/25'
  }
]

export function NewReport() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState<Section>('subject')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsingMessage, setParsingMessage] = useState('Parsing your manual...')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedText, setParsedText] = useState('')
  
  // Authentication guard - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login')
      navigate('/login', { replace: true })
    }
  }, [user, authLoading, navigate])
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  // Don't render if user is not authenticated
  if (!user) {
    return null
  }
  
  const [reportData, setReportData] = useState<NewReportState>({
    subject: '',
    unitName: '',
    practicalTitle: '',
    practicalNumber: '',
    uploadedFile: null,
    parsedData: null,
    results: ''
  })

  // Image upload state management
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadError, setUploadError] = useState<string>('')

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, x: 100, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1
    },
    exit: { 
      opacity: 0, 
      x: -100, 
      scale: 0.95
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    },
    hover: { 
      y: -5,
      scale: 1.02
    }
  }

  // Supported file types for parsing - PDF only
  const SUPPORTED_FILE_TYPES = {
    'application/pdf': 'PDF'
  }

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check if file exists
    if (!file) {
      return { isValid: false, error: 'No file selected' }
    }

    // Validate file type - PDF only
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Only PDF manuals are supported at this time. Please upload the official manual in PDF format.' 
      }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File size too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload files smaller than 10MB.` 
      }
    }

    // Validate minimum file size (avoid empty files)
    if (file.size < 100) {
      return { 
        isValid: false, 
        error: 'File appears to be empty or corrupted. Please select a valid file.' 
      }
    }

    // Additional validation for specific file types
    if (file.type === 'application/pdf' && file.size < 1000) {
      return { 
        isValid: false, 
        error: 'PDF file appears to be too small or corrupted.' 
      }
    }

    return { isValid: true }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setReportData({ ...reportData, uploadedFile: file })
  }



  // Browser-based PDF parsing using PDF.js library
  const parseManual = async (file: File): Promise<string> => {
    try {
      // Validate file before processing
      const validation = validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file')
      }

      // Only process PDF files
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF manuals are supported at this time. Please upload the official manual in PDF format.')
      }

      // PDF.js worker is already configured at module level

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Load PDF document using pdfjs-dist
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let textContent = ''
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const text = await page.getTextContent()
        textContent += text.items.map((item: any) => item.str).join(' ') + '\n'
      }
      
      // Clean up extracted text
      textContent = textContent.trim()
      
      // Validate that we extracted meaningful text
      if (!textContent || textContent.length < 10) {
        throw new Error('This PDF could not be parsed. Please check if it\'s a valid text-based PDF.')
      }
      
      // Load parsed content into editor
      setParsedText(textContent)
      
      return textContent
    } catch (error) {
      console.error('Error parsing PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to parse file: ${errorMessage}`)
    }
  }



  const handleParseFile = async () => {
    if (!reportData.uploadedFile) {
      alert('Please select a file first.')
      return
    }
    
    setParsing(true)
    setParsedText('') // Clear previous data
    
    // Updated progress messages for browser-based parsing
    const messages = [
      'Reading PDF file...',
      'Extracting text content...',
      'Processing document structure...',
      'Almost done!'
    ]
    
    let messageIndex = 0
    setParsingMessage(messages[0])
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      setParsingMessage(messages[messageIndex])
    }, 1500) // Change message every 1.5 seconds for faster browser parsing
    
    try {
      console.log('Starting browser-based PDF parsing...', {
        fileName: reportData.uploadedFile.name,
        fileType: reportData.uploadedFile.type,
        fileSize: reportData.uploadedFile.size
      })
      
      const extractedText = await parseManual(reportData.uploadedFile)
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No meaningful text could be extracted from the file.')
      }
      
      setParsedText(extractedText)
      
      const parsedData = {
        title: reportData.uploadedFile.name,
        content: extractedText,
        extractedAt: new Date().toISOString()
      }
      
      setReportData({ ...reportData, parsedData })
      console.log('Browser-based PDF parsing completed successfully')
    } catch (error) {
      console.error('Error parsing PDF file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`PDF parsing failed: ${errorMessage}`)
      setParsedText('') // Clear any partial data
    } finally {
      clearInterval(messageInterval)
      setParsingMessage('Parsing your manual...') // Reset message
      setParsing(false)
    }
  }

  const handleSubjectSelect = (subject: string) => {
    setReportData({ ...reportData, subject })
    setCurrentSection('manual')
  }

  const handleSaveAndContinue = async () => {
    // Validate required fields
    if (!user) {
      alert('Please log in to continue.')
      return
    }
    
    // Optional: Check if parsed data exists, but don't block saving
    const hasParseData = reportData.parsedData && parsedText.trim()
    
    if (!reportData.unitName.trim() || !reportData.practicalTitle.trim() || !reportData.practicalNumber) {
      alert('Please fill in all required fields (Unit Name, Practical Title, and Practical Number).')
      return
    }
    
    // Prevent multiple simultaneous save attempts
    if (saving) {
      return
    }
    
    setSaving(true)
    
    try {
      // Validate user authentication first
      if (!user || !user.id) {
        throw new Error('You must be logged in to save manual data. Please log in and try again.')
      }
      
      console.log('User authenticated:', { userId: user.id, email: user.email })
      
      // Convert parsed text to structured JSONB format (handle cases with or without parsed data)
      const manualContent = {
        originalFileName: reportData.uploadedFile?.name || '',
        extractedText: hasParseData ? parsedText : '',
        extractedAt: hasParseData ? new Date().toISOString() : null,
        sections: hasParseData ? parsedText.split('\n\n').filter(section => section.trim().length > 0) : [],
        metadata: {
          fileType: reportData.uploadedFile?.type || '',
          fileSize: reportData.uploadedFile?.size || 0,
          processingMethod: hasParseData ? 'pdfjs-dist' : 'none',
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        },
        validation: {
          textLength: hasParseData ? parsedText.length : 0,
          sectionCount: hasParseData ? parsedText.split('\n\n').filter(section => section.trim().length > 0).length : 0,
          hasContent: hasParseData ? parsedText.trim().length > 10 : false
        }
      }
      
      // Validate practical number is a valid number
      const practicalNum = parseFloat(String(reportData.practicalNumber))
      if (isNaN(practicalNum) || practicalNum <= 0) {
        throw new Error('Practical number must be a valid positive number.')
      }
      
      console.log('Attempting to save manual data:', {
        userId: user.id,
        subject: reportData.subject,
        unitName: reportData.unitName,
        practicalTitle: reportData.practicalTitle,
        practicalNumber: practicalNum
      })
      
      // Save to Supabase manual_templates table using new schema without practicals table dependency
      const { data, error } = await supabase
        .from('manual_templates')
        .insert({
          manual_url: reportData.uploadedFile ? `uploads/${reportData.uploadedFile.name}` : 'manual_upload_placeholder',
          parsed_text: manualContent,
          uploaded_by: user.id,
          practical_title: reportData.practicalTitle.trim(),
          practical_number: practicalNum,
          unit_code: reportData.unitName?.trim() || 'UNKNOWN',
          subject: reportData.subject
        })
        .select()
      
      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Handle specific error types with detailed RLS error handling
        if (error.code === '23505') {
          throw new Error('A manual with this practical number already exists for this unit. Please use a different practical number.')
        } else if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy Violation:', error)
          throw new Error('Permission denied: You do not have access to save manual data. This may be due to authentication issues or database permissions. Please log out and log back in, then try again.')
        } else if (error.code === '23503') {
          throw new Error('Database constraint violation: Some referenced data may be missing. Please contact support.')
        } else if (error.code === '23502') {
          throw new Error('Required field missing: Please ensure all required fields are filled.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error: Please check your internet connection and try again.')
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
          throw new Error('Authentication token expired: Please log out and log back in, then try again.')
        } else {
          throw new Error(`Database error (${error.code || 'unknown'}): ${error.message}. Please try again or contact support if the problem persists.`)
        }
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data was returned after saving. The operation may have failed. Please try again.')
      }
      
      console.log('Successfully saved to manual_templates:', data[0])
      
      // Show success notification
      alert('✅ Manual data saved successfully! Proceeding to results entry.')
      
      // Navigate to results section
      setCurrentSection('results')
      
    } catch (error) {
      console.error('Error saving manual data:', error)
      
      // Enhanced error messaging for users with specific guidance
      let errorMessage = 'An unknown error occurred while saving.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Additional context for common issues
      if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('authentication')) {
        errorMessage += '\n\n💡 Troubleshooting tips:\n• Try logging out and logging back in\n• Check your internet connection\n• Contact support if the issue persists'
      }
      
      alert(`❌ Save Failed: ${errorMessage}`)
      
    } finally {
      setSaving(false)
    }
  }

  // Data collection function for Gemini AI
  const collectDataForAI = async () => {
    const data = {
      parsedText: parsedText || reportData.parsedData || '',
      results: reportData.results,
      images: uploadedImages.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    }
    
    // Validate required data
    if (!data.parsedText.trim()) {
      throw new Error('No manual content available. Please upload and parse a manual first.')
    }
    
    // Validate that results are provided (now mandatory)
    if (!data.results.trim()) {
      throw new Error('Results are required. Please enter your experimental results, observations, and data before generating a draft report.')
    }
    
    return data
  }

  // Exponential backoff utility function
  const exponentialBackoff = async (fn: () => Promise<any>, maxRetries = 5) => {
    let retries = 0
    while (retries < maxRetries) {
      try {
        return await fn()
      } catch (error) {
        retries++
        if (retries === maxRetries) throw error
        
        const delay = Math.pow(2, retries) * 1000 // 2s, 4s, 8s, 16s, 32s
        console.log(`Retry ${retries}/${maxRetries} after ${delay}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Generate draft report using Gemini AI with session-based workflow
  const handleDraftReport = async () => {
    setLoading(true)
    
    try {
      // Collect and validate data
      const aiData = await collectDataForAI()
      
      // Generate unique session ID
      const sessionId = crypto.randomUUID()
      
      // Store the complete input data in global state for full report generation
      const { setReportData } = useReportStore.getState()
      const completeInputData = {
        manualText: aiData.parsedText,
        parsedContent: aiData.parsedText, // For backward compatibility
        resultsJson: aiData.results ? { rawResults: aiData.results } : null,
        userInputs: {
          subject: reportData.subject,
          unitName: reportData.unitName,
          practicalTitle: reportData.practicalTitle,
          practicalNumber: reportData.practicalNumber,
          images: aiData.images
        },
        sessionInfo: {
           sessionId: sessionId,
           timestamp: Date.now(),
           userId: user.id
         }
      }
      
      // Save to global state and session storage
      setReportData(completeInputData)
      console.log('Stored complete input data in global state:', completeInputData)
      
      console.log('Creating draft record in Supabase...')
      
      // Create draft record in Supabase with exponential backoff
      const draftRecord = await exponentialBackoff(async () => {
        const { data, error } = await supabase
          .from('drafts')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            status: 'pending'
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
      
      console.log('Draft record created:', draftRecord)
      console.log('Sending data to Gemini AI for draft generation...')
      
      // Call the API endpoint with session_id and user_id
      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...aiData,
          sessionId: sessionId,
          user_id: user.id
        })
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        
        try {
          // Check if response has content before parsing JSON
          const responseText = await response.text()
          console.log('Error response text:', responseText)
          
          if (responseText.trim()) {
            try {
              const errorData = JSON.parse(responseText)
              errorMessage = errorData.error || errorMessage
            } catch (parseError) {
              console.warn('Failed to parse error response as JSON:', parseError)
              // Use the raw text as error message if it's not empty
              errorMessage = responseText.length > 100 ? 
                `Server error: ${responseText.substring(0, 100)}...` : 
                `Server error: ${responseText}`
            }
          }
        } catch (textError) {
          console.warn('Failed to read error response text:', textError)
        }
        
        throw new Error(errorMessage)
      }
      
      let result
      try {
        // Check if response has content before parsing JSON
        const responseText = await response.text()
        console.log('Success response text length:', responseText.length)
        
        if (!responseText.trim()) {
          throw new Error('Server returned empty response')
        }
        
        try {
          result = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Failed to parse success response as JSON:', parseError)
          console.log('Response text that failed to parse:', responseText)
          throw new Error('Server returned invalid JSON response. Please try again or contact support if the issue persists.')
        }
      } catch (textError) {
        console.error('Failed to read response text:', textError)
        throw new Error('Failed to read server response. Please check your connection and try again.')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate draft')
      }
      
      console.log('Draft generation initiated successfully, sessionId:', result.sessionId)
      
      // Wait a moment for the draft to be saved, then fetch it from Supabase
      console.log('Fetching saved draft from Supabase...')
      
      // Fetch the saved draft from Supabase using exponential backoff
      const draftData = await exponentialBackoff(async () => {
        const { data, error } = await supabase
          .from('drafts')
          .select('*')
          .eq('session_id', result.sessionId)
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Draft not found yet, throw error to trigger retry
            throw new Error('Draft not ready yet, retrying...')
          }
          throw error
        }
        
        if (data.status === 'pending') {
          throw new Error('Draft still processing, retrying...')
        }
        
        if (data.status === 'failed') {
          throw new Error(data.error_message || 'Draft generation failed')
        }
        
        return data
      })
      
      console.log('Draft fetched successfully:', draftData)
      
      // Navigate to draft viewer with session_id
      navigate(`/draft-viewer/${result.sessionId}`)
      
    } catch (error) {
      console.error('Error generating draft:', error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      alert(`Failed to generate draft: ${errorMessage}`)
      
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    switch (currentSection) {
      case 'manual':
        setCurrentSection('subject')
        break
      case 'results':
        setCurrentSection('manual')
        break
      default:
        navigate('/dashboard')
    }
  }

  const getStepNumber = () => {
    switch (currentSection) {
      case 'subject': return 1
      case 'manual': return 2
      case 'results': return 3
      default: return 1
    }
  }

  // Image upload handlers
  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPG, PNG, or GIF)'
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    return null
  }

  const handleImageUpload = async (files: FileList) => {
    setUploadError('')
    const validFiles: File[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateImageFile(file)
      
      if (error) {
        setUploadError(error)
        return
      }
      
      validFiles.push(file)
    }

    // Upload to Supabase storage
    for (const file of validFiles) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const fileName = `${fileId}-${file.name}`
      
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        const { data, error } = await supabase.storage
          .from('drawings')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw error
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        setUploadedImages(prev => [...prev, file])
        
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[file.name]
            return newProgress
          })
        }, 2000)
        
      } catch (error) {
        console.error('Upload error:', error)
        setUploadError(`Failed to upload ${file.name}. Please try again.`)
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const createImagePreview = (file: File): string => {
    return URL.createObjectURL(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" />
      </div>
      
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={goBack}
                className="mr-4 p-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Create New Report</h1>
                  <p className="text-sm text-white/60">Step {getStepNumber()} of 5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center ${currentSection === 'subject' ? 'text-cyan-400' : 'text-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentSection === 'subject' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  1
                </div>
                <span className="ml-2">Subject</span>
              </div>
              
              <div className={`flex items-center ${currentSection === 'manual' ? 'text-cyan-400' : 'text-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentSection === 'manual' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  2
                </div>
                <span className="ml-2">Manual</span>
              </div>
              
              <div className={`flex items-center ${currentSection === 'results' ? 'text-cyan-400' : 'text-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentSection === 'results' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  3
                </div>
                <span className="ml-2">Results</span>
              </div>
            </div>
            
            <div className="mt-4 bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentSection === 'subject' ? 33 : currentSection === 'manual' ? 66 : 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Subject Selection */}
          {currentSection === 'subject' && (
            <motion.div
              key="subject"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <motion.h2 
                  className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Select Subject
                </motion.h2>
                <motion.p 
                  className="text-white/60 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Choose the subject for your lab report
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {subjects.map((subject, index) => {
                  const Icon = subject.icon
                  return (
                    <motion.button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject.id)}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: index * 0.1 }}
                      className="group relative p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/25"
                    >
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-20 h-20 rounded-full ${subject.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">{subject.name}</h3>
                        <p className="text-white/70 text-sm leading-relaxed">{subject.description}</p>
                      </div>
                      
                      {/* Animated glow effect */}
                      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-all duration-500 ${subject.glowColor} blur-xl`} />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/5 to-transparent" />
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Manual Entry Section */}
          {currentSection === 'manual' && (
            <motion.div
              key="manual"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <motion.h2 
                  className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Enter Exact Practical Details
                </motion.h2>
                <motion.p 
                  className="text-white/60 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Provide your practical information and upload manual document
                </motion.p>
              </div>

              {/* Form Fields */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">Unit Name</label>
                  <input
                    type="text"
                    value={reportData.unitName}
                    onChange={(e) => setReportData({ ...reportData, unitName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/25 transition-all duration-300"
                    placeholder="Enter unit name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">Practical Title</label>
                  <input
                    type="text"
                    value={reportData.practicalTitle}
                    onChange={(e) => setReportData({ ...reportData, practicalTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/25 transition-all duration-300"
                    placeholder="Enter practical title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">Practical Number</label>
                  <input
                    type="text"
                    value={reportData.practicalNumber}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow numbers with up to 3 decimal places
                      if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
                        setReportData({ ...reportData, practicalNumber: value })
                      }
                    }}
                    pattern="^\d*\.?\d{0,3}$"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/25 transition-all duration-300"
                    placeholder="Enter practical number"
                  />
                </div>
              </motion.div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: File Upload */}
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Upload Manual Document</h3>
                    <p className="text-white/60 text-sm mb-6">Upload a clean manual document containing the practical details. DO NOT upload scanned PDF.</p>
                    
                    <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-cyan-400/50 transition-all duration-300">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-12 h-12 text-white/60 mx-auto mb-4" />
                      <p className="text-white/80 font-medium mb-2">Drop your file here or click to browse</p>
                      <p className="text-white/50 text-sm mb-4">Supports PDF files only</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                      >
                        Choose File
                      </button>
                    </div>

                    {reportData.uploadedFile && (
                      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex flex-col space-y-4">
                          {/* Show file name on all screen sizes */}
                          <div className="flex items-center space-x-3 justify-center md:justify-start">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            <span className="text-white text-sm">{reportData.uploadedFile.name}</span>
                          </div>
                          {/* Center parse button at bottom */}
                          <div className="flex justify-center">
                            <button
                              onClick={handleParseFile}
                              disabled={parsing}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 text-sm md:text-base"
                            >
                              {parsing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {parsingMessage}
                                </>
                              ) : (
                                'Parse'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Right: Parsed Data Display */}
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 h-full">
                    <h3 className="text-xl font-semibold text-white mb-4">Parsed Data</h3>
                    {reportData.parsedData ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-white/80 text-sm font-medium block mb-2">Extracted Content - Always check the parsed content and make sure it's correct before continuing.</label>
                          <textarea
                            value={parsedText}
                            onChange={(e) => {
                              setParsedText(e.target.value)
                              // Update parsed data when user edits
                              const updatedData = {
                                ...reportData.parsedData,
                                content: e.target.value
                              }
                              setReportData({ ...reportData, parsedData: updatedData })
                            }}
                            className="w-full h-64 px-4 py-3 bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/25 transition-all duration-300"
                            placeholder="Parsed data will appear here..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-white/40">
                        <div className="text-center">
                          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Upload and parse a document to see extracted data</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-8">
                <motion.button
                  onClick={() => setCurrentSection('subject')}
                  className="flex items-center px-6 py-3 text-white/60 hover:text-white transition-colors duration-300"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </motion.button>
                
                <motion.button
                  onClick={handleSaveAndContinue}
                  disabled={!reportData.unitName?.trim() || !reportData.practicalTitle?.trim() || !reportData.practicalNumber || saving}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  whileHover={{ scale: saving ? 1 : 1.05 }}
                  whileTap={{ scale: saving ? 1 : 0.95 }}
                  title={!reportData.unitName?.trim() || !reportData.practicalTitle?.trim() || !reportData.practicalNumber ? 'Please fill in all required fields' : 'Save manual data and continue to results entry'}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Continue
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          {currentSection === 'results' && (
            <motion.div
              key="results"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <motion.h2 
                  className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Enter Your Results
                </motion.h2>
                <motion.p 
                  className="text-white/60 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Provide your experimental results and observations
                </motion.p>
              </div>

              <motion.div 
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-white/80 text-lg font-medium">Results & Observations</label>
                      <span className="px-3 py-1 bg-red-500/20 text-red-300 text-sm rounded-full">Required</span>
                    </div>
                    <textarea
                      value={reportData.results}
                      onChange={(e) => setReportData({ ...reportData, results: e.target.value })}
                      className="w-full h-64 px-4 py-3 bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/25 transition-all duration-300"
                      placeholder="Enter your experimental results, observations, data tables, calculations, etc... (Required for draft generation)"
                    />
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-300 text-sm">
                        ⚠️ <strong>Results are required!</strong> Please enter your experimental results, observations, and data before generating a draft report. This ensures your report is complete and accurate.
                      </p>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-white/80 text-lg font-medium flex items-center">
                        <Image className="w-5 h-5 mr-2" />
                        Upload Drawings or Diagrams
                        <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">Optional</span>
                      </label>
                    </div>
                    
                    <div className="space-y-4">
                      {/* File Input */}
                      <div className="relative">
                        <input
                          type="file"
                          id="image-upload"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer group"
                        >
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-white/40 group-hover:text-white/60 transition-colors" />
                            <p className="text-white/60 group-hover:text-white/80 transition-colors">
                              Click to upload images or drag and drop
                            </p>
                            <p className="text-white/40 text-sm mt-1">
                              JPG, PNG, GIF up to 5MB
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Upload Error */}
                      {uploadError && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                          {uploadError}
                        </div>
                      )}

                      {/* Upload Progress */}
                      {Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="space-y-1">
                              <div className="flex justify-between text-sm text-white/60">
                                <span>{fileName}</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Image Previews */}
                      {uploadedImages.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-white/80 font-medium">Uploaded Images ({uploadedImages.length})</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {uploadedImages.map((file, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                  <img
                                    src={createImagePreview(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                  {file.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-white/60 text-sm">
                    <p className="mb-2">💡 <strong>Tips for better results:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Include numerical data and measurements</li>
                      <li>Describe any unexpected observations</li>
                      <li>Note any errors or limitations</li>
                      <li>Include calculations if applicable</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Navigation */}
              <div className="flex justify-between pt-8">
                <motion.button
                  onClick={() => setCurrentSection('manual')}
                  className="flex items-center px-6 py-3 text-white/60 hover:text-white transition-colors duration-300"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </motion.button>
                
                <motion.button
                  onClick={handleDraftReport}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={!reportData.results.trim() ? 'Please enter your results before generating a draft report' : 'Generate AI draft report'}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI Generating Draft...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Get Draft
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}