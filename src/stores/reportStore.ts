import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// TypeScript interfaces for report data
export interface ReportInputData {
  manualText: string
  parsedContent: string
  resultsJson: any
  userInputs: {
    subject?: string
    experimentType?: string
    additionalNotes?: string
    unitName?: string
    practicalTitle?: string
    practicalNumber?: string | number
    images?: Array<{
      name: string
      size: number
      type: string
    }>
  }
  sessionInfo: {
    sessionId: string
    userId?: string
    timestamp: number
  }
  reportId?: string
  draftId?: string
}

export interface ReportStore {
  // Current report data
  currentReportData: ReportInputData | null
  
  // Actions
  setReportData: (data: ReportInputData) => void
  updateReportData: (updates: Partial<ReportInputData>) => void
  clearReportData: () => void
  getReportData: () => ReportInputData | null
  
  // Validation
  validateReportData: (data: ReportInputData | null) => boolean
  
  // Session storage backup
  saveToSessionStorage: () => void
  loadFromSessionStorage: () => ReportInputData | null
}

// Validation function
const validateReportData = (data: ReportInputData | null): boolean => {
  if (!data) return false
  
  return !!(
    data.manualText &&
    data.sessionInfo?.sessionId &&
    data.sessionInfo?.timestamp
  )
}

// Session storage key
const SESSION_STORAGE_KEY = 'scidraft_report_data'

// Create Zustand store with persistence
export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      currentReportData: null,
      
      setReportData: (data: ReportInputData) => {
        set({ currentReportData: data })
        // Also save to sessionStorage as backup
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
        } catch (error) {
          console.warn('Failed to save to sessionStorage:', error)
        }
      },
      
      updateReportData: (updates: Partial<ReportInputData>) => {
        const current = get().currentReportData
        if (current) {
          const updated = { ...current, ...updates }
          set({ currentReportData: updated })
          // Update sessionStorage
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated))
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error)
          }
        }
      },
      
      clearReportData: () => {
        set({ currentReportData: null })
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
        } catch (error) {
          console.warn('Failed to clear sessionStorage:', error)
        }
      },
      
      getReportData: () => {
        const current = get().currentReportData
        
        // If no current data, try to load from sessionStorage
        if (!current) {
          return get().loadFromSessionStorage()
        }
        
        return current
      },
      
      validateReportData,
      
      saveToSessionStorage: () => {
        const data = get().currentReportData
        if (data) {
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
          } catch (error) {
            console.error('Failed to save to sessionStorage:', error)
          }
        }
      },
      
      loadFromSessionStorage: () => {
        try {
          const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
          if (stored) {
            const data = JSON.parse(stored) as ReportInputData
            if (validateReportData(data)) {
              set({ currentReportData: data })
              return data
            }
          }
        } catch (error) {
          console.warn('Failed to load from sessionStorage:', error)
        }
        return null
      }
    }),
    {
      name: 'scidraft-report-storage',
      // Only persist essential data, not the full state
      partialize: (state) => ({ currentReportData: state.currentReportData })
    }
  )
)

// Utility functions for external use
export const reportDataUtils = {
  // Create session info
  createSessionInfo: (userId?: string): ReportInputData['sessionInfo'] => ({
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    timestamp: Date.now()
  }),
  
  // Validate manual text
  isValidManualText: (text: string): boolean => {
    return text.trim().length > 50 // Minimum length for meaningful content
  },
  
  // Clean and prepare data for storage
  prepareDataForStorage: (rawData: Partial<ReportInputData>): ReportInputData | null => {
    if (!rawData.manualText || !reportDataUtils.isValidManualText(rawData.manualText)) {
      return null
    }
    
    return {
      manualText: rawData.manualText,
      parsedContent: rawData.parsedContent || '',
      resultsJson: rawData.resultsJson || {},
      userInputs: rawData.userInputs || {},
      sessionInfo: rawData.sessionInfo || reportDataUtils.createSessionInfo(),
      reportId: rawData.reportId,
      draftId: rawData.draftId
    }
  }
}