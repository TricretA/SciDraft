import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { FeedbackOverlay } from './FeedbackOverlay'

interface FeedbackButtonProps {
  className?: string
  position?: 'fixed' | 'relative'
}

export function FeedbackButton({ className = '', position = 'fixed' }: FeedbackButtonProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)

  const baseClasses = position === 'fixed' 
    ? 'fixed bottom-6 right-6 z-40'
    : 'relative'

  return (
    <>
      <motion.button
        onClick={() => setIsOverlayOpen(true)}
        className={`${baseClasses} ${className} group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <MessageSquare className="h-5 w-5" />
        <motion.span
          className="hidden group-hover:block text-sm font-medium whitespace-nowrap"
          initial={{ width: 0, opacity: 0 }}
          whileHover={{ width: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          Feedback
        </motion.span>
      </motion.button>

      <FeedbackOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
      />
    </>
  )
}