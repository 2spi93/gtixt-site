'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Building2, AlertTriangle, Target, BarChart3, Activity, Shield } from 'lucide-react'
import InfoTooltip from '@/components/ui/InfoTooltip'

interface KPICardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  iconName?: 'trending-up' | 'building' | 'alert' | 'target' | 'chart' | 'activity' | 'shield'
  gradient?: boolean
}

const iconMap = {
  'trending-up': TrendingUp,
  'building': Building2,
  'alert': AlertTriangle,
  'target': Target,
  'chart': BarChart3,
  'activity': Activity,
  'shield': Shield
}

function getKpiHelp(label: string): { content: string; example?: string } {
  const key = label.toLowerCase()

  if (key.includes('index')) {
    return {
      content: 'Composite score calculated from the GTIXT five-pillar institutional methodology.',
      example: 'Example: 72.9 means stronger governance and transparency than the peer median.',
    }
  }

  if (key.includes('firm')) {
    return {
      content: 'Number of firms currently covered in the active benchmark universe.',
      example: 'Coverage includes firms with enough evidence and validation quality.',
    }
  }

  if (key.includes('risk')) {
    return {
      content: 'Aggregated market risk signal based on policy changes, incidents, and operational stability.',
      example: 'Lower values generally indicate improved reliability conditions.',
    }
  }

  return {
    content: 'KPI monitored continuously and normalized for institutional comparability.',
    example: 'Use trend and value together for context.',
  }
}

export default function KPICard({ label, value, change, changeType = 'neutral', iconName, gradient = false }: KPICardProps) {
  const Icon = iconName ? iconMap[iconName] : null
  const help = getKpiHelp(label)
  
  const changeColors = {
    positive: 'text-success',
    negative: 'text-danger',
    neutral: 'text-dark-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`
        relative group rounded-2xl p-6
        ${gradient 
          ? 'bg-gradient-to-br from-primary-500/10 via-primary-400/5 to-transparent' 
          : 'bg-white/[0.03]'
        }
        backdrop-blur-xl border border-white/[0.05]
        hover:border-primary-500/30 hover:shadow-glow-sm
        transition-all duration-300
      `}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 to-primary-800/0 
                      group-hover:from-primary-500/5 group-hover:to-primary-800/5 transition-all duration-500" />
      
      <div className="relative">
        <div className="inline-flex p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 mb-4
                       group-hover:bg-primary-500/20 transition-colors">
          {Icon ? <Icon className="w-6 h-6 text-primary-400" /> : <span className="w-6 h-6 block" />}
        </div>
        
        <div className="mb-2 flex items-center gap-2">
          <div className="text-sm font-medium text-dark-300">{label}</div>
          <InfoTooltip content={help.content} example={help.example} label={`${label} explanation`} />
        </div>
        
        <div className="flex items-baseline gap-3">
          <div className="text-4xl font-bold text-white tracking-tight">
            {value}
          </div>
          
          {change && (
            <div className={`text-sm font-semibold ${changeColors[changeType]}`}>
              {change}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
