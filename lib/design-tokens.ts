/**
 * GTIXT Design System - Global Styling
 * Glassmorphism + Gradient Signature Theme
 */

import '@/styles/globals.css'

export const designTokens = {
  colors: {
    // Primary Gradient
    primary: {
      from: '#06B6D4', // Turquoise
      via: '#22D3EE',  // Cyan
      to: '#1E3A8A',   // Deep Blue
    },
    
    // Semantic Colors
    success: '#10B981',    // Emerald
    warning: '#F59E0B',    // Amber  
    danger: '#EF4444',     // Red
    info: '#3B82F6',       // Blue
    
    // Backgrounds
    background: {
      primary: 'rgb(3, 7, 18)',      // slate-950
      secondary: 'rgb(15, 23, 42)',  // slate-900
      tertiary: 'rgb(30, 41, 59)',   // slate-800
    },
    
    // Text
    text: {
      primary: 'rgb(248, 250, 252)',   // slate-50
      secondary: 'rgb(226, 232, 240)', // slate-100
      tertiary: 'rgb(203, 213, 225)',  // slate-300
      muted: 'rgb(148, 163, 184)',     // slate-400
    },
  },

  shadows: {
    // Glassmorphic glow effects
    glow: {
      xs: '0 0 8px rgba(6, 182, 212, 0.2)', 
      sm: '0 0 16px rgba(34, 211, 238, 0.25)',
      md: '0 0 24px rgba(34, 211, 238, 0.3)',
      lg: '0 20px 25px -5px rgba(34, 211, 238, 0.4)',
    },
  },

  transitions: {
    micro: 'all 150ms ease-in-out',
    smooth: 'all 200ms ease-in-out',
    bounce: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  spacing: {
    // Consistent gaps for grid
    gap: '8px',
    padding: '16px',
    margin: '16px',
  },

  borders: {
    radius: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
    color: 'rgba(6, 182, 212, 0.3)', // Turquoise with transparency
  },

  // Glassmorphism base
  glass: {
    light: 'bg-slate-900/30 backdrop-blur-md border border-cyan-500/30 shadow-lg shadow-cyan-500/20',
    medium: 'bg-slate-800/40 backdrop-blur-lg border border-cyan-400/40 shadow-lg shadow-cyan-500/30',
    dark: 'bg-slate-900/50 backdrop-blur-xl border border-cyan-500/50 shadow-lg shadow-cyan-500/40',
  },
}

export default designTokens
