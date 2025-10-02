import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Phone } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [success, setSuccess] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        errors.phoneNumber = 'Please enter a valid phone number'
      }
    }
    
    setFieldErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      setError('Please correct the errors below')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSuccess(false)

    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, formData.name, formData.phoneNumber)
      if (error) {
        console.log('Signup error received:', error)
        
        // Handle error object from AuthContext
        const errorMessage = error.message || error.toString()
        
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          setError(errorMessage)
          // Optionally redirect to login page
          setTimeout(() => {
            navigate('/login')
          }, 3000)
        } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
          setError('Please check your input and try again.')
        } else if (errorMessage.includes('rate') || errorMessage.includes('too many')) {
          setError('Too many attempts. Please try again later.')
        } else {
          setError(errorMessage || 'An unexpected error occurred. Please try again.')
        }
      } else {
        setSuccess(true)
        // Don't navigate to dashboard - user needs to confirm email first
      }
    } catch (err: any) {
      console.error('Signup exception:', err)
      setError('An unexpected error occurred. Please try again.')
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
            Account Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Please check your email and click the confirmation link to activate your account. You'll need to verify your email before you can sign in.
          </p>
          
          <motion.div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login Page
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #1e3a8a 50%, #7c3aed 75%, #1e1b4b 100%)'
          }}
          animate={{
            background: [
              'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #1e3a8a 50%, #7c3aed 75%, #1e1b4b 100%)',
              'linear-gradient(135deg, #312e81 0%, #1e3a8a 25%, #7c3aed 50%, #1e1b4b 75%, #312e81 100%)',
              'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 25%, #1e1b4b 50%, #312e81 75%, #1e3a8a 100%)',
              'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #1e3a8a 50%, #7c3aed 75%, #1e1b4b 100%)'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <motion.div 
              className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <img 
                src="/SciDraft-symbol-logo.png" 
                alt="SciDraft Logo" 
                className="w-10 h-10 object-contain relative z-10"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </motion.div>
          </motion.div>
          <motion.h2 
            className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Create Account
          </motion.h2>
          <motion.p 
            className="text-blue-200/80 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Join SciDraft for professional research reports
          </motion.p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center" style={{display: 'none'}}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <img 
              src="/SciDraft-symbol-logo.png" 
              alt="SciDraft Logo" 
              className="w-24 h-auto object-contain"
            />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-3xl font-bold text-gray-900"
          >
            Join SciDraft Today
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-gray-600"
          >
            Create your free account and start generating professional lab reports
          </motion.p>
        </div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          className="backdrop-blur-md border border-white/20 rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          {/* Glassmorphism overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/5 pointer-events-none"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-6 relative z-10"
          onSubmit={handleSubmit}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="backdrop-blur-md bg-red-500/10 border border-red-400/30 rounded-2xl p-4 flex items-center space-x-3 relative z-10"
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
            {/* Name Field */}
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.7, duration: 0.5 }}
             >
               <label htmlFor="name" className="block text-sm font-medium text-blue-100 mb-3">
                 Full Name
               </label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                   <User className="h-5 w-5 text-blue-300/70 group-focus-within:text-blue-300 transition-colors duration-200" />
                 </div>
                 <motion.input
                   id="name"
                   name="name"
                   type="text"
                   autoComplete="name"
                   required
                   value={formData.name}
                   onChange={handleChange}
                   whileFocus={{ scale: 1.02 }}
                   className={`block w-full pl-12 pr-4 py-4 backdrop-blur-md bg-white/5 border rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${
                     fieldErrors.name ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                   }`}
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                     backdropFilter: 'blur(12px)',
                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                   }}
                   placeholder="Enter your full name"
                 />
                 {fieldErrors.name && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-300"
                    >
                      {fieldErrors.name}
                    </motion.p>
                  )}
                  <motion.div 
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ backdropFilter: 'blur(12px)' }}
                  />
               </div>
             </motion.div>

            {/* Email Field */}
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.8, duration: 0.5 }}
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
                   value={formData.email}
                   onChange={handleChange}
                   whileFocus={{ scale: 1.02 }}
                   className={`block w-full pl-12 pr-4 py-4 backdrop-blur-md bg-white/5 border rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${
                     fieldErrors.email ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                   }`}
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                     backdropFilter: 'blur(12px)',
                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                   }}
                   placeholder="Enter your email"
                 />
                 {fieldErrors.email && (
                   <motion.p 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mt-2 text-sm text-red-300"
                   >
                     {fieldErrors.email}
                   </motion.p>
                 )}
                 <motion.div 
                   className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{ backdropFilter: 'blur(12px)' }}
                 />
               </div>
             </motion.div>

            {/* Phone Number Field */}
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.9, duration: 0.5 }}
             >
               <label htmlFor="phoneNumber" className="block text-sm font-medium text-blue-100 mb-3">
                 Phone Number
               </label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                   <Phone className="h-5 w-5 text-blue-300/70 group-focus-within:text-blue-300 transition-colors duration-200" />
                 </div>
                 <motion.input
                   id="phoneNumber"
                   name="phoneNumber"
                   type="tel"
                   autoComplete="tel"
                   required
                   value={formData.phoneNumber}
                   onChange={handleChange}
                   whileFocus={{ scale: 1.02 }}
                   className={`block w-full pl-12 pr-4 py-4 backdrop-blur-md bg-white/5 border rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${
                     fieldErrors.phoneNumber ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                   }`}
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                     backdropFilter: 'blur(12px)',
                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                   }}
                   placeholder="Enter your phone number"
                 />
                 {fieldErrors.phoneNumber && (
                   <motion.p 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mt-2 text-sm text-red-300"
                   >
                     {fieldErrors.phoneNumber}
                   </motion.p>
                 )}
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
               transition={{ delay: 1.0, duration: 0.5 }}
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
                   autoComplete="new-password"
                   required
                   value={formData.password}
                   onChange={handleChange}
                   whileFocus={{ scale: 1.02 }}
                   className={`block w-full pl-12 pr-14 py-4 backdrop-blur-md bg-white/5 border rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${
                     fieldErrors.password ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                   }`}
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                     backdropFilter: 'blur(12px)',
                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                   }}
                   placeholder="Create a password (min. 6 characters)"
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
                  {fieldErrors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-300"
                    >
                      {fieldErrors.password}
                    </motion.p>
                  )}
               </div>
             </motion.div>

            {/* Confirm Password Field */}
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1.1, duration: 0.5 }}
             >
               <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100 mb-3">
                 Confirm Password
               </label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                   <Lock className="h-5 w-5 text-blue-300/70 group-focus-within:text-blue-300 transition-colors duration-200" />
                 </div>
                 <motion.input
                   id="confirmPassword"
                   name="confirmPassword"
                   type={showConfirmPassword ? 'text' : 'password'}
                   autoComplete="new-password"
                   required
                   value={formData.confirmPassword}
                   onChange={handleChange}
                   whileFocus={{ scale: 1.02 }}
                   className={`block w-full pl-12 pr-14 py-4 backdrop-blur-md bg-white/5 border rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 ${
                     fieldErrors.confirmPassword ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                   }`}
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                     backdropFilter: 'blur(12px)',
                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.1)'
                   }}
                   placeholder="Confirm your password"
                 />
                 <motion.button
                   type="button"
                   className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.95 }}
                 >
                   {showConfirmPassword ? (
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

          {/* Terms Agreement */}
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-white/90">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-300 hover:text-blue-200">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-300 hover:text-blue-200">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <motion.button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 text-sm font-semibold rounded-2xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {loading ? (
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Creating Account...
                </motion.div>
              ) : (
                <span className="relative z-10 flex items-center">
                  Create Your Free Account
                  <motion.div
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </span>
              )}
            </motion.button>
          </motion.div>

          {/* Sign In Link */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            <p className="text-sm text-blue-200/80">
              Already have an account?{' '}
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-block"
              >
                <Link
                  to="/login"
                  className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-300 hover:to-purple-300 transition-all duration-300 relative"
                  style={{
                    textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                  }}
                >
                  Sign in here
                  <motion.div
                    className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%' }}
                  />
                </Link>
              </motion.span>
            </p>
          </motion.div>
        </motion.form>
        </motion.div>

        {/* Back to Home */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            to="/"
            className="text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}