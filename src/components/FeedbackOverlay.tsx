import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface FeedbackOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const emojiReactions = [
  { emoji: '😞', label: 'Very Bad', value: 1, color: 'from-red-500 to-red-600' },
  { emoji: '😕', label: 'Bad', value: 2, color: 'from-orange-500 to-orange-600' },
  { emoji: '😐', label: 'Okay', value: 3, color: 'from-yellow-500 to-yellow-600' },
  { emoji: '😊', label: 'Good', value: 4, color: 'from-green-500 to-green-600' },
  { emoji: '😍', label: 'Very Happy', value: 5, color: 'from-purple-500 to-purple-600' }
]

export function FeedbackOverlay({ isOpen, onClose }: FeedbackOverlayProps) {
  const { user } = useAuth()
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!selectedRating) {
      setError('Please select a reaction')
      return
    }

    try {
      setLoading(true)
      setError('')

      const feedbackData = {
        user_id: user?.id,
        rating: selectedRating,
        comment: comment.trim() || null,
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('feedback')
        .insert([feedbackData])

      if (insertError) {
        console.error('Error saving feedback:', insertError)
        throw new Error('Failed to submit feedback')
      }

      setSubmitted(true)
      setTimeout(() => {
        onClose()
        resetForm()
      }, 2000)
    } catch (err: any) {
      console.error('Feedback submission error:', err)
      setError(err.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedRating(null)
    setComment('')
    setSubmitted(false)
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">How was your experience?</h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-lg font-semibold text-white mb-2">Thank you!</h4>
              <p className="text-white/70">Your feedback helps us improve SciDraft.</p>
            </motion.div>
          ) : (
            <>
              {/* Emoji Reactions */}
              <div className="mb-6">
                <p className="text-white/80 text-sm mb-4 text-center">Select your reaction:</p>
                <div className="flex justify-between gap-2">
                  {emojiReactions.map((reaction) => (
                    <motion.button
                      key={reaction.value}
                      onClick={() => setSelectedRating(reaction.value)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                        selectedRating === reaction.value
                          ? `bg-gradient-to-r ${reaction.color} shadow-lg scale-110`
                          : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                      }`}
                      whileHover={{ scale: selectedRating === reaction.value ? 1.1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-2xl mb-1">{reaction.emoji}</span>
                      <span className="text-xs text-white/70 font-medium">{reaction.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Comment Section */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">Additional comments (optional):</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-right text-xs text-white/50 mt-1">
                  {comment.length}/500
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedRating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}