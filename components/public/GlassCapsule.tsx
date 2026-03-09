'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface GlassCapsuleProps {
  iconName: 'database' | 'trending-up' | 'chart' | 'clock' | 'file-json' | 'code' | 'download'
  title: string
  subtitle: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'info'
}

const iconMap = {
  'database': '/assets/realistic-icons/database.png',
  'trending-up': '/assets/realistic-icons/trending-up.png',
  'chart': '/assets/realistic-icons/chart.png',
  'clock': '/assets/realistic-icons/clock.png',
  'file-json': '/assets/realistic-icons/file-json.png',
  'code': '/assets/realistic-icons/code.png',
  'download': '/assets/realistic-icons/download.png'
}

const variantStyles = {
  primary: {
    bg: 'from-primary-500/10 to-primary-600/5',
    border: 'border-primary-500/30',
    icon: 'text-primary-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,212,198,0.3)]'
  },
  secondary: {
    bg: 'from-primary-800/10 to-info/5',
    border: 'border-primary-800/30',
    icon: 'text-primary-800',
    glow: 'group-hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]'
  },
  success: {
    bg: 'from-green-500/10 to-green-600/5',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]'
  },
  info: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
  }
}

export default function GlassCapsule({ 
  iconName, 
  title, 
  subtitle, 
  onClick,
  variant = 'primary' 
}: GlassCapsuleProps) {
  const iconSrc = iconMap[iconName]
  const styles = variantStyles[variant]
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative w-full rounded-2xl p-6
        bg-gradient-to-br ${styles.bg}
        backdrop-blur-xl border ${styles.border}
        hover:border-opacity-60 ${styles.glow}
        transition-all duration-300 text-left
        overflow-hidden
      `}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent
                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="relative flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] 
                        group-hover:bg-white/[0.08] transition-colors`}>
          <Image src={iconSrc} alt={title} width={24} height={24} className={`object-contain ${styles.icon}`} unoptimized />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
            {title}
          </div>
          <div className="text-sm text-dark-300">
            {subtitle}
          </div>
        </div>
        
        {/* Arrow indicator */}
        <div className="text-dark-400 group-hover:text-primary-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </motion.button>
  )
}
