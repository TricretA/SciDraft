import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// Add CSS animation for gradient shift
const gradientShiftStyle = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`

export function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your inbox and follow the instructions to reset your password.
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <button
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Try a different email address
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {/* Inject CSS animations */}
      <style>{gradientShiftStyle}</style>
      
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 8s ease infinite'
        }}
      />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 relative z-20"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: 'spring', bounce: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl mb-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <img 
              src="/SciDraft-symbol-logo.png" 
              alt="SciDraft Logo" 
              className="h-8 w-8 object-contain"
              style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 mb-3"
            style={{
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite',
              textShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
            }}
          >
            Reset Password
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-blue-200/80 text-base leading-relaxed"
          >
            Enter your email address and we'll send you a secure link to reset your password.
          </motion.p>
        </motion.div>

        {/* Form Container */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 space-y-6 p-8 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          onSubmit={handleSubmit}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="relative p-4 rounded-xl text-red-300 text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)'
              }}
            >
              <AlertCircle className="inline w-4 h-4 mr-2" />
              {error}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <label htmlFor="email" className="block text-sm font-semibold text-blue-200 mb-3">
              Email Address
            </label>
            <div className="relative group">
              <motion.div
                className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Mail className="h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors duration-200" />
              </motion.div>
              <motion.input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-white placeholder-blue-300/60 rounded-xl transition-all duration-300 focus:outline-none relative z-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                placeholder="Enter your email address"
                whileFocus={{
                  scale: 1.02,
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
                whileHover={{
                  boxShadow: '0 6px 24px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
              {/* Focus ring effect */}
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                whileFocus={{ opacity: 1 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full flex justify-center items-center py-4 px-6 text-sm font-semibold rounded-xl text-white transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            style={{
              background: loading 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6))'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Button background animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20"
              animate={{
                x: loading ? ['-100%', '100%'] : '0%',
              }}
              transition={{
                duration: loading ? 1.5 : 0,
                repeat: loading ? Infinity : 0,
                ease: 'linear'
              }}
            />
            
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <span className="relative z-10">Send Reset Link</span>
                <motion.div
                  className="ml-2 relative z-10"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </>
            )}
          </motion.button>

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-center"
          >
            <Link
              to="/login"
              className="group inline-flex items-center text-sm font-medium text-blue-300 hover:text-blue-200 transition-all duration-300 relative"
            >
              <motion.span
                whileHover={{ x: -4 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="mr-2"
              >
                ←
              </motion.span>
              <span className="relative">
                Back to login
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                />
              </span>
            </Link>
          </motion.div>
        </motion.form>

        {/* Back to Home */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
   </>
  )
}