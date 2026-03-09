'use client'

interface RiskBadgeProps {
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const riskConfig = {
  LOW: {
    label: 'Low',
    icon: '/assets/generated-icons/risk-low.png',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]'
  },
  MEDIUM: {
    label: 'Medium',
    icon: '/assets/generated-icons/risk-medium.png',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]'
  },
  HIGH: {
    label: 'High',
    icon: '/assets/generated-icons/risk-high.png',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  },
  CRITICAL: {
    label: 'Critical',
    icon: '/assets/generated-icons/risk-critical.png',
    bg: 'bg-red-600/10',
    border: 'border-red-600/30',
    text: 'text-red-500',
    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.3)]'
  }
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

export default function RiskBadge({ risk, size = 'md', showIcon = true }: RiskBadgeProps) {
  const config = riskConfig[risk]
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full
      ${config.bg} ${config.border} ${config.text}
      border backdrop-blur-sm
      font-semibold uppercase tracking-wide
      ${sizeClasses[size]}
      hover:${config.glow} transition-shadow duration-300
    `}>
      {showIcon && (
        <img
          src={config.icon}
          alt={config.label}
          className="w-3.5 h-3.5 object-contain"
        />
      )}
      {config.label}
    </span>
  )
}
