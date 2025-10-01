import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, FileText, X } from 'lucide-react'

interface SuccessNotificationProps {
  isOpen: boolean
  onClose: () => void
  onViewReport: () => void
}

export function SuccessNotification({ isOpen, onClose, onViewReport }: SuccessNotificationProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Success!</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-white/90 font-semibold mb-3 text-lg">
              🎉 Report Successfully Generated!
            </p>
            <p className="text-white/80 text-sm mb-3">
              Your comprehensive scientific report has been created with all sections including methodology, results, analysis, and conclusions.
            </p>
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-2">
              <p className="text-blue-100 text-sm font-medium mb-1">
                📋 Next Steps:
              </p>
              <p className="text-blue-200/90 text-xs">
                Click "View Full Report" below to access your complete document. A secure payment will be required to unlock the full content.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={onViewReport}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 rounded-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
            >
              <FileText className="h-5 w-5" />
              <span>View Full Report</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Premium</span>
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/80 font-medium transition-all duration-200 text-sm"
            >
              View Later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}