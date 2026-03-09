'use client'

import { motion } from 'framer-motion'

interface ScoreBarProps {
  score: number
  maxScore?: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4'
}

const colorClasses = {
  primary: {
    bar: 'from-primary-500 to-primary-400',
    glow: 'shadow-[0_0_15px_rgba(0,212,198,0.5)]'
  },
  success: {
    bar: 'from-green-500 to-green-400',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]'
  },
  warning: {
    bar: 'from-yellow-500 to-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]'
  },
  danger: {
    bar: 'from-red-500 to-red-400',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'
  }
}

export default function ScoreBar({ 
  score, 
  maxScore = 100, 
  label,
  showValue = true,
  size = 'md',
  color = 'primary'
}: ScoreBarProps) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const styles = colorClasses[color]
  
  // Auto-determine color based on score if primary
  const autoColor = color === 'primary' 
    ? percentage >= 80 ? 'success' 
      : percentage >= 60 ? 'primary'
      : percentage >= 40 ? 'warning'
      : 'danger'
    : color
  
  const finalStyles = colorClasses[autoColor]
  
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-dark-300">{label}</span>}
          {showValue && <span className="text-sm font-bold text-white">{score.toFixed(1)}</span>}
        </div>
      )}
      
      <div className={`relative w-full ${sizeClasses[size]} bg-white/[0.05] rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${finalStyles.bar} ${finalStyles.glow} rounded-full`}
        />
      </div>
    </div>
  )
}
