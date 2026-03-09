/**
 * GlassCard - Glassmorphic Card Component
 * Core design system component with gradient header support
 */

'use client'

import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  title?: React.ReactNode
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'light' | 'medium' | 'dark'
  gradient?: boolean
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({
  children,
  className = '',
  title,
  subtitle,
  icon,
  variant = 'light',
  gradient = false,
  hover = true,
  onClick,
}: GlassCardProps) {
  const variantStyles = {
    light: 'bg-slate-900/30 backdrop-blur-md border border-cyan-500/30',
    medium: 'bg-slate-800/40 backdrop-blur-lg border border-cyan-400/40',
    dark: 'bg-slate-900/50 backdrop-blur-xl border border-cyan-500/50',
  }

  const hoverClass = hover
    ? 'hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/40 transition-all duration-200 hover:-translate-y-1 cursor-pointer'
    : ''

  const glassBase = variantStyles[variant]

  return (
    <div
      onClick={onClick}
      className={`
        ${glassBase}
        rounded-lg shadow-lg shadow-cyan-500/20
        p-6 transition-all duration-200
        ${hoverClass}
        ${className}
      `}
    >
      {/* Header with optional gradient title */}
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-cyan-500/20">
          {icon && (
            <div className="text-cyan-400 mt-1 hover:scale-110 transition-transform">
              {icon}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <h3
                className={`
                  font-semibold text-lg leading-tight
                  ${gradient
                    ? 'bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent'
                    : 'text-slate-50'
                  }
                `}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="text-slate-200">{children}</div>
    </div>
  )
}

/**
 * GlassGrid - Layout container with consistent spacing
 */
interface GlassGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function GlassGrid({
  children,
  cols = 2,
  gap = 'md',
  className = '',
}: GlassGridProps) {
  const colMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapMap = {
    xs: 'gap-4',
    sm: 'gap-6',
    md: 'gap-8',
    lg: 'gap-10',
  }

  return (
    <div className={`grid ${colMap[cols]} ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  )
}

/**
 * GradientText - Reusable gradient typography
 */
interface GradientTextProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'body'
  className?: string
  animated?: boolean
}

export function GradientText({
  children,
  variant = 'h2',
  className = '',
  animated = false,
}: GradientTextProps) {
  const baseStyles = {
    h1: 'text-4xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-xl font-semibold',
    body: 'text-base',
  }

  const animatedClass = animated
    ? 'animate-pulse'
    : ''

  return (
    <span
      className={`
        bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 
        bg-clip-text text-transparent
        ${baseStyles[variant]}
        ${animatedClass}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

/**
 * GlassButton - Redesigned button with glass effect
 */
interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  icon?: React.ReactNode
  loading?: boolean
}

export function GlassButton({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  loading = false,
  className = '',
  disabled = false,
  ...props
}: GlassButtonProps) {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30',
    secondary:
      'bg-slate-700/40 text-slate-100 border border-cyan-500/40 hover:bg-slate-600/50 hover:border-cyan-400/60',
    danger:
      'bg-red-900/40 text-red-200 border border-red-500/40 hover:bg-red-800/50 hover:border-red-400/60',
    ghost:
      'text-slate-300 hover:text-slate-100 hover:bg-slate-800/30',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-lg font-medium
        flex items-center justify-center gap-2
        transition-all duration-200
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin h-4 w-4">⏳</span>
          Processing...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}

/**
 * GlassStat - Statistics display with gradient
 */
interface GlassStatProps {
  label: string
  value: React.ReactNode
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}

export function GlassStat({
  label,
  value,
  suffix = '',
  trend = 'neutral',
  icon,
}: GlassStatProps) {
  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  }

  return (
    <div className="space-y-1">
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <div className="flex items-baseline gap-2">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <p className="text-2xl font-bold text-slate-50">
          {value}
          {suffix && <span className="text-lg text-slate-400 ml-1">{suffix}</span>}
        </p>
        {trend && trend !== 'neutral' && (
          <span className={`text-xs ${trendColor[trend]}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  )
}
