import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  FileText,
  Edit3,
  Save,
  X,
  History,
  Eye,
  EyeOff,
  Clock,
  User,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  RotateCcw,
  Settings,
  Beaker,
  Atom,
  Microscope
} from 'lucide-react'

interface Prompt {
  id: string
  name: string
  type: 'system' | 'chemistry' | 'biology' | 'physics'
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  admin_name?: string
}

interface PromptVersion {
  id: string
  prompt_id: string
  version: number
  content: string
  changes_summary: string
  created_at: string
  created_by: string
  admin_name?: string
}

export function AdminPrompts() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [changesSummary, setChangesSummary] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'system' | 'chemistry' | 'biology' | 'physics'>('system')

  useEffect(() => {
    fetchPrompts()
    fetchPromptVersions()
    
    // Set up real-time subscription for prompts and prompt versions
    const promptsSubscription = supabase
      .channel('prompts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prompts'
      }, () => {
        fetchPrompts()
      })
      .subscribe()

    const versionsSubscription = supabase
      .channel('prompt_versions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prompt_versions'
      }, () => {
        fetchPromptVersions()
      })
      .subscribe()

    return () => {
      promptsSubscription.unsubscribe()
      versionsSubscription.unsubscribe()
    }
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const { data: promptsData, error } = await supabase
        .from('prompts')
        .select(`
          *,
          users!prompts_created_by_fkey(
            full_name,
            email
          )
        `)
        .eq('is_active', true)
        .order('type')
        .order('version', { ascending: false })

      if (error) throw error

      const promptsWithAdmin: Prompt[] = promptsData?.map(prompt => ({
        ...prompt,
        admin_name: prompt.users?.full_name || prompt.users?.email || 'Unknown Admin'
      })) || []

      setPrompts(promptsWithAdmin)
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromptVersions = async () => {
    try {
      const { data: versionsData, error } = await supabase
        .from('prompt_versions')
        .select(`
          *,
          users!prompt_versions_created_by_fkey(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const versionsWithAdmin: PromptVersion[] = versionsData?.map(version => ({
        ...version,
        admin_name: version.users?.full_name || version.users?.email || 'Unknown Admin'
      })) || []

      setPromptVersions(versionsWithAdmin)
    } catch (error) {
      console.error('Error fetching prompt versions:', error)
    }
  }

  const handleEditStart = (prompt: Prompt) => {
    setEditingPrompt(prompt.id)
    setEditContent(prompt.content)
    setChangesSummary('')
  }

  const handleEditCancel = () => {
    setEditingPrompt(null)
    setEditContent('')
    setChangesSummary('')
  }

  const handleSave = async (promptId: string) => {
    if (!user || !changesSummary.trim()) {
      alert('Please provide a summary of changes')
      return
    }

    setSaving(true)
    try {
      const currentPrompt = prompts.find(p => p.id === promptId)
      if (!currentPrompt) throw new Error('Prompt not found')

      // Create version history entry
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          version: currentPrompt.version,
          content: currentPrompt.content,
          changes_summary: changesSummary,
          created_by: user.id
        })

      if (versionError) throw versionError

      // Update the prompt with new content and version
      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          content: editContent,
          version: currentPrompt.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)

      if (updateError) throw updateError

      await fetchPrompts()
      await fetchPromptVersions()
      handleEditCancel()
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevertToVersion = async (promptId: string, versionId: string) => {
    if (!user) return
    
    if (!confirm('Are you sure you want to revert to this version? This will create a new version with the old content.')) {
      return
    }

    try {
      const version = promptVersions.find(v => v.id === versionId)
      const currentPrompt = prompts.find(p => p.id === promptId)
      
      if (!version || !currentPrompt) throw new Error('Version or prompt not found')

      // Create version history entry for current state
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          version: currentPrompt.version,
          content: currentPrompt.content,
          changes_summary: `Reverted to version ${version.version}`,
          created_by: user.id
        })

      if (versionError) throw versionError

      // Update prompt with reverted content
      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          content: version.content,
          version: currentPrompt.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)

      if (updateError) throw updateError

      await fetchPrompts()
      await fetchPromptVersions()
      setShowVersionHistory(null)
    } catch (error) {
      console.error('Error reverting prompt:', error)
      alert('Failed to revert prompt. Please try again.')
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

  const getPromptIcon = (type: string) => {
    switch (type) {
      case 'system':
        return Settings
      case 'chemistry':
        return Beaker
      case 'biology':
        return Microscope
      case 'physics':
        return Atom
      default:
        return FileText
    }
  }

  const getPromptColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-100 text-blue-600'
      case 'chemistry':
        return 'bg-green-100 text-green-600'
      case 'biology':
        return 'bg-purple-100 text-purple-600'
      case 'physics':
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredPrompts = prompts.filter(prompt => prompt.type === selectedTab)
  const currentPrompt = filteredPrompts[0] // Get the latest version for the selected type

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
          <h1 className="text-2xl font-bold text-gray-900">Prompts Settings</h1>
          <p className="text-gray-600">Manage AI prompts and version history</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'system', label: 'System Prompt', icon: Settings },
            { key: 'chemistry', label: 'Chemistry', icon: Beaker },
            { key: 'biology', label: 'Biology', icon: Microscope },
            { key: 'physics', label: 'Physics', icon: Atom }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                selectedTab === key
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Prompt */}
      {currentPrompt && (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPromptColor(currentPrompt.type)}`}>
                  {React.createElement(getPromptIcon(currentPrompt.type), { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {currentPrompt.type} Prompt
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Version {currentPrompt.version}</span>
                    <span>•</span>
                    <span>Updated {formatDate(currentPrompt.updated_at)}</span>
                    <span>•</span>
                    <span>by {currentPrompt.admin_name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowVersionHistory(currentPrompt.id)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>Version History</span>
                </button>
                
                {editingPrompt === currentPrompt.id ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleEditCancel}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => handleSave(currentPrompt.id)}
                      disabled={saving || !changesSummary.trim()}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditStart(currentPrompt)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Changes Summary Input (when editing) */}
            {editingPrompt === currentPrompt.id && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary of Changes *
                </label>
                <input
                  type="text"
                  value={changesSummary}
                  onChange={(e) => setChangesSummary(e.target.value)}
                  placeholder="Describe what changes you made..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>
            )}

            {/* Prompt Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Prompt Content
                </label>
                <button
                  onClick={() => setPreviewMode(previewMode === currentPrompt.id ? null : currentPrompt.id)}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {previewMode === currentPrompt.id ? (
                    <><EyeOff className="w-4 h-4" /><span>Edit Mode</span></>
                  ) : (
                    <><Eye className="w-4 h-4" /><span>Preview Mode</span></>
                  )}
                </button>
              </div>
              
              {editingPrompt === currentPrompt.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-96 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-sm"
                  placeholder="Enter prompt content..."
                />
              ) : previewMode === currentPrompt.id ? (
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900">
                      {currentPrompt.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                    {currentPrompt.content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Prompt Found */}
      {!currentPrompt && (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {selectedTab} prompt found
          </h3>
          <p className="text-gray-600 mb-6">
            Create a new {selectedTab} prompt to get started.
          </p>
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors mx-auto">
            <Plus className="w-4 h-4" />
            <span>Create Prompt</span>
          </button>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
                  <p className="text-sm text-gray-600">
                    {currentPrompt?.type.charAt(0).toUpperCase()}{currentPrompt?.type.slice(1)} Prompt
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVersionHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="p-6">
                {/* Current Version */}
                {currentPrompt && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">Version {currentPrompt.version}</span>
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            Current
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{formatDate(currentPrompt.updated_at)}</span>
                          <span>•</span>
                          <span>by {currentPrompt.admin_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Version History */}
                <div className="space-y-4">
                  {promptVersions
                    .filter(version => version.prompt_id === showVersionHistory)
                    .map((version, index) => (
                      <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <GitBranch className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-gray-900">Version {version.version}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>{formatDate(version.created_at)}</span>
                                <span>•</span>
                                <span>by {version.admin_name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRevertToVersion(showVersionHistory, version.id)}
                            className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revert</span>
                          </button>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Changes:</p>
                          <p className="text-sm text-gray-600">{version.changes_summary}</p>
                        </div>
                        
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                            View Content
                          </summary>
                          <div className="mt-3 bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <pre className="text-xs text-gray-900 whitespace-pre-wrap font-mono">
                              {version.content}
                            </pre>
                          </div>
                        </details>
                      </div>
                    ))}
                </div>
                
                {promptVersions.filter(version => version.prompt_id === showVersionHistory).length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">No version history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}