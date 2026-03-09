'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface ShieldBadgeProps {
  rank: number
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function ShieldBadge({ rank, size = 'md', animated = true }: ShieldBadgeProps) {
  const sizeStyles = {
    sm: { container: 'w-10 h-10', text: 'text-sm', icon: 32 },
    md: { container: 'w-12 h-12', text: 'text-base', icon: 40 },
    lg: { container: 'w-16 h-16', text: 'text-xl', icon: 56 },
  }

  const style = sizeStyles[size]

  // Top 3 get special shield treatment
  const getTier = (rank: number) => {
    if (rank === 1) return { 
      color: 'from-yellow-400 via-amber-500 to-yellow-600',
      glow: 'shadow-yellow-500/50',
      border: 'border-yellow-400/60',
      textColor: 'text-yellow-900',
      shimmer: true
    }
    if (rank === 2) return { 
      color: 'from-slate-300 via-slate-400 to-slate-500',
      glow: 'shadow-slate-400/40',
      border: 'border-slate-300/50',
      textColor: 'text-slate-900',
      shimmer: true
    }
    if (rank === 3) return { 
      color: 'from-orange-600 via-amber-700 to-orange-800',
      glow: 'shadow-orange-600/40',
      border: 'border-orange-500/50',
      textColor: 'text-orange-100',
      shimmer: true
    }
    if (rank <= 10) return {
      color: 'from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/30',
      border: 'border-cyan-500/40',
      textColor: 'text-white',
      shimmer: false
    }
    return {
      color: 'from-slate-600 to-slate-700',
      glow: 'shadow-slate-600/20',
      border: 'border-slate-500/30',
      textColor: 'text-slate-200',
      shimmer: false
    }
  }

  const tier = getTier(rank)

  const containerAnimation = animated ? {
    initial: { scale: 0.8, opacity: 0, rotateY: -180 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotateY: 0,
    },
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
      duration: 0.6
    },
    whileHover: { 
      scale: 1.1,
      rotateY: 15,
    }
  } : {}

  const shimmerAnimation = tier.shimmer ? {
    animate: {
      backgroundPosition: ['200% 0%', '-200% 0%'],
    },
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: 'linear' as const
    }
  } : {}

  return (
    <motion.div
      className={`${style.container} relative flex items-center justify-center perspective-1000`}
      {...containerAnimation}
    >
      {/* Base shield with gradient */}
      <div className={`
        absolute inset-0 rounded-xl
        bg-gradient-to-br ${tier.color}
        ${tier.glow} shadow-xl
        border-2 ${tier.border}
      `}>
        {/* Shimmer effect for top 3 */}
        {tier.shimmer && (
          <motion.div
            className="absolute inset-0 rounded-xl opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            {...shimmerAnimation}
          />
        )}
      </div>

      {/* Shield icon overlay for top ranks */}
      {rank <= 10 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Image 
            src="/assets/realistic-icons/shield.png" 
            alt="Shield" 
            width={style.icon} 
            height={style.icon}
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      {/* Rank number */}
      <span className={`
        ${style.text} font-bold ${tier.textColor} 
        relative z-10 drop-shadow-lg
      `}>
        #{rank}
      </span>

      {/* Glass reflection effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      
      {/* 3D edge highlight */}
      <div className="absolute inset-0 rounded-xl border-t-2 border-l-2 border-white/30 pointer-events-none" />
    </motion.div>
  )
}
