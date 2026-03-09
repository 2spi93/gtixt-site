import { motion } from 'framer-motion'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  message?: string
}

const SIZES = {
  sm: 20,
  md: 40,
  lg: 60,
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'var(--gtixt-turquoise-primary)',
  message 
}: LoadingSpinnerProps) {
  const dimension = SIZES[size]

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          width: dimension,
          height: dimension,
          border: `3px solid ${color}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
        }}
        aria-label="Loading"
        role="status"
      />
      {message && (
        <p className="text-sm text-[var(--gtixt-gray-medium)] animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

export function LoadingSkeleton({
  width = '100%',
  height = '20px',
  className = '',
}: {
  width?: string
  height?: string
  className?: string
}) {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`rounded ${className}`}
      style={{
        width,
        height,
        backgroundColor: 'var(--gtixt-gray-light)',
      }}
      aria-label="Loading content"
      role="status"
    />
  )
}
