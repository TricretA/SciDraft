import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.img
        src="/gallery/SciDraft-loading-logo-04.png"
        alt="Loading..."
        className={`${sizeClasses[size]} object-contain`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}

// Alternative fallback spinner if logo is not available
export function FallbackSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}></div>
    </div>
  )
}