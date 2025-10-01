import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        // Preserve the original error message for better debugging
        console.error('Login error:', error)
        setError(error || 'Login failed')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      // Log the full error for debugging
      console.error('Login exception:', err)
      
      // Provide more specific error messages based on error type
      let errorMessage = 'An unexpected error occurred'
      
      if (err?.message) {
        if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.'
        } else if (err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (err.message.includes('CORS')) {
          errorMessage = 'Connection blocked. Please try refreshing the page or contact support.'
        } else {
          // Preserve the original error message for debugging
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
        <motion.div 
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2), rgba(236,72,153,0.2))',
              'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(236,72,153,0.2), rgba(59,130,246,0.2))',
              'linear-gradient(225deg, rgba(236,72,153,0.2), rgba(59,130,246,0.2), rgba(147,51,234,0.2))',
              'linear-gradient(315deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2), rgba(236,72,153,0.2))'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
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
         initial={{ opacity: 0, y: 20, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         transition={{ duration: 0.8, ease: 'easeOut' }}
         className="relative max-w-md w-full space-y-8 z-10"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img 
                src="/SciDraft-symbol-logo.png" 
                alt="SciDraft Logo" 
                className="relative w-24 h-auto object-contain filter drop-shadow-2xl" 
              />
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3"
          >
            Welcome Back
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-blue-100/80 text-lg font-light"
          >
            Sign in to continue your scientific journey
          </motion.p>
        </div>

        {/* Form */}
        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative mt-8 space-y-6 backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
          onSubmit={handleSubmit}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="backdrop-blur-md bg-red-500/10 border border-red-400/30 rounded-2xl p-4 flex items-center space-x-3"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <AlertCircle className="h-5 w-5 text-red-300" />
              </motion.div>
              <span className="text-red-100 text-sm font-medium">{error}</span>
            </motion.div>
          )}
          
          <div className="space-y-4">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-3">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-blue-300/70 group-focus-within:text-blue-300 transition-colors duration-200" />
                </div>
                <motion.input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  className="block w-full pl-12 pr-4 py-4 backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    backdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  placeholder="Enter your email"
                />
                <motion.div 
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ backdropFilter: 'blur(12px)' }}
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-3">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-blue-300/70 group-focus-within:text-blue-300 transition-colors duration-200" />
                </div>
                <motion.input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  className="block w-full pl-12 pr-12 py-4 backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    backdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  placeholder="Enter your password"
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-blue-300/70 hover:text-blue-300 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-300/70 hover:text-blue-300 transition-colors duration-200" />
                  )}
                </motion.button>
                <motion.div 
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ backdropFilter: 'blur(12px)' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/reset-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(59,130,246,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex justify-center py-4 px-6 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(147,51,234,0.8))',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backdropFilter: 'blur(12px)' }}
            />
            <span className="relative z-10">
              {loading ? (
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Signing in...</span>
                </div>
              ) : (
                <motion.span
                  whileHover={{ letterSpacing: '0.05em' }}
                  transition={{ duration: 0.2 }}
                >
                  Sign In
                </motion.span>
              )}
            </span>
          </motion.button>

          {/* Footer Links */}
          <motion.div 
            className="flex items-center justify-between text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/reset-password" 
                className="text-blue-200 hover:text-white transition-all duration-300 relative group"
              >
                <span className="relative z-10">Forgot password?</span>
                <motion.div 
                  className="absolute inset-0 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2 p-2"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/signup" 
                className="text-blue-200 hover:text-white transition-all duration-300 relative group"
              >
                <span className="relative z-10">Create account</span>
                <motion.div 
                  className="absolute inset-0 bg-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2 p-2"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
              </Link>
            </motion.div>
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
  )
}