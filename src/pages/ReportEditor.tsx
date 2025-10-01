import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Save, 
  Download, 
  Eye, 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  BarChart3, 
  Plus, 
  Trash2, 
  Upload,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Report, ManualTemplate } from '../lib/supabase'

interface ReportSection {
  id: string
  title: string
  content: string
  type: 'text' | 'table' | 'image' | 'chart'
  order: number
}

interface TableData {
  headers: string[]
  rows: string[][]
}

export function ReportEditor() {
  const { reportId } = useParams<{ reportId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [report, setReport] = useState<Report | null>(null)
  const [manualTemplate, setManualTemplate] = useState<ManualTemplate | null>(null)
  const [sections, setSections] = useState<ReportSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const fetchReport = async () => {
    if (!reportId) return

    setLoading(true)
    try {
      // Fetch report with related data
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select(`
          *,
          practical:practicals(*),
          manual_template:manual_templates(*)
        `)
        .eq('id', reportId)
        .single()

      if (reportError) throw reportError
      
      setReport(reportData)
      setManualTemplate(reportData.manual_template)

      // Initialize sections from template or create default ones
      if (reportData.sections) {
        setSections(JSON.parse(reportData.sections))
      } else {
        initializeDefaultSections(reportData.manual_template)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultSections = (template: ManualTemplate | null) => {
    const defaultSections: ReportSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: report?.title || '',
        type: 'text',
        order: 1
      },
      {
        id: 'objectives',
        title: 'Objectives',
        content: report?.objectives || '',
        type: 'text',
        order: 2
      },
      {
        id: 'hypothesis',
        title: 'Hypothesis',
        content: report?.hypothesis || '',
        type: 'text',
        order: 3
      },
      {
        id: 'materials',
        title: 'Materials and Equipment',
        content: template?.materials || '',
        type: 'text',
        order: 4
      },
      {
        id: 'procedure',
        title: 'Procedure',
        content: template?.procedure || '',
        type: 'text',
        order: 5
      },
      {
        id: 'observations',
        title: 'Observations and Data',
        content: '',
        type: 'table',
        order: 6
      },
      {
        id: 'results',
        title: 'Results and Analysis',
        content: '',
        type: 'text',
        order: 7
      },
      {
        id: 'discussion',
        title: 'Discussion',
        content: '',
        type: 'text',
        order: 8
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        content: '',
        type: 'text',
        order: 9
      }
    ]

    setSections(defaultSections)
  }

  const updateSection = (sectionId: string, content: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, content } : section
    ))
  }

  const addSection = (type: 'text' | 'table' | 'image' | 'chart') => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      content: '',
      type,
      order: sections.length + 1
    }
    setSections(prev => [...prev, newSection])
    setActiveSection(newSection.id)
  }

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
    if (activeSection === sectionId) {
      setActiveSection(null)
    }
  }

  const saveReport = async () => {
    if (!report || !reportId) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          sections: JSON.stringify(sections),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) throw error

      // Show success message
      console.log('Report saved successfully')
    } catch (error) {
      console.error('Error saving report:', error)
    } finally {
      setSaving(false)
    }
  }

  const generateReport = async (type: 'draft' | 'full') => {
    if (!report || !reportId) return

    setSaving(true)
    try {
      // Update report status
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: type === 'draft' ? 'draft_generated' : 'completed',
          sections: JSON.stringify(sections),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) throw updateError

      // Create export record
      const { data: exportData, error: exportError } = await supabase
        .from('exports')
        .insert({
          report_id: reportId,
          user_id: user?.id,
          export_type: type,
          format: 'pdf',
          status: 'processing'
        })
        .select()
        .single()

      if (exportError) throw exportError

      // Navigate to preview/download page
      navigate(`/reports/${reportId}/preview?export=${exportData.id}`)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderSectionEditor = (section: ReportSection) => {
    switch (section.type) {
      case 'text':
        return (
          <textarea
            value={section.content}
            onChange={(e) => updateSection(section.id, e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            placeholder={`Enter ${section.title.toLowerCase()} content...`}
          />
        )
      
      case 'table':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Table</span>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Add Row
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Parameter</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Value</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((row) => (
                    <tr key={row} className="border-t border-gray-200">
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          placeholder="Parameter name"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          placeholder="Measured value"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          placeholder="Unit"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          placeholder="Additional notes"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      
      case 'image':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload images, diagrams, or charts</p>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </button>
            </div>
          </div>
        )
      
      default:
        return (
          <textarea
            value={section.content}
            onChange={(e) => updateSection(section.id, e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            placeholder={`Enter ${section.title.toLowerCase()} content...`}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-4">The report you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Last saved: {new Date(report.updated_at).toLocaleString()}</span>
                    <span className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  previewMode 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              
              <button
                onClick={saveReport}
                disabled={saving}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => generateReport('draft')}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Draft Report
                </button>
                
                <button
                  onClick={() => generateReport('full')}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Section Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Sections</h3>
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                  {/* Add section dropdown would go here */}
                </div>
              </div>
              
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{section.title}</span>
                      {section.type === 'table' && <Table className="h-3 w-3" />}
                      {section.type === 'image' && <ImageIcon className="h-3 w-3" />}
                      {section.type === 'chart' && <BarChart3 className="h-3 w-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {previewMode ? (
              /* Preview Mode */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="prose max-w-none">
                  {sections.map((section) => (
                    <div key={section.id} className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {section.title}
                      </h2>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {section.content || <em className="text-gray-400">No content added yet</em>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {sections.map((section) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                      activeSection === section.id
                        ? 'border-blue-300 ring-2 ring-blue-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            section.type === 'text' ? 'bg-gray-100 text-gray-700' :
                            section.type === 'table' ? 'bg-blue-100 text-blue-700' :
                            section.type === 'image' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {section.type}
                          </span>
                          {!['title', 'objectives', 'hypothesis'].includes(section.id) && (
                            <button
                              onClick={() => deleteSection(section.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {renderSectionEditor(section)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}