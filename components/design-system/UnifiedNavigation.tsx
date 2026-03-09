/**
 * UnifiedNavigation - Glassmorphic Navigation Component
 * Works for both admin and public pages with consistent styling
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { GradientText } from './GlassComponents'
import { RealIcon, RealIconName } from './RealIcon'

interface NavItem {
  label: string
  href: string
  icon?: RealIconName
  badge?: string
}

interface UnifiedNavigationProps {
  variant?: 'admin' | 'public'
  items?: NavItem[]
  className?: string
}

const defaultPublicItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Rankings', href: '/rankings', icon: 'rankings' },
  { label: 'Firms', href: '/firms', icon: 'firms' },
  { label: 'Analytics', href: '/analytics', icon: 'analytics' },
  { label: 'Industry Map', href: '/industry-map', icon: 'galaxy' },
  { label: 'Methodology', href: '/methodology', icon: 'methodology' },
  { label: 'Research', href: '/research', icon: 'research' },
  { label: 'API Docs', href: '/api-docs', icon: 'api' },
]

const defaultAdminItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Integrity', href: '/admin/integrity', icon: 'shield', badge: 'NEW' },
  { label: 'Agents', href: '/admin/agents', icon: 'agents' },
  { label: 'Copilot', href: '/admin/copilot', icon: 'copilot' },
  { label: 'Firms', href: '/admin/firms', icon: 'firms' },
  { label: 'Users', href: '/admin/users', icon: 'users' },
  { label: 'Jobs', href: '/admin/jobs', icon: 'jobs' },
  { label: 'Logs', href: '/admin/logs', icon: 'logs' },
  { label: 'Audit', href: '/admin/audit', icon: 'audit' },
]

export function UnifiedNavigation({
  variant = 'public',
  items,
  className = '',
}: UnifiedNavigationProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = items || (variant === 'admin' ? defaultAdminItems : defaultPublicItems)

  const isActive = (href: string) => {
    if (href === '/' || href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={`hidden lg:block fixed top-0 left-0 right-0 z-50 bg-slate-900/30 backdrop-blur-lg border-b border-cyan-500/20 ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={variant === 'admin' ? '/admin' : '/'} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:scale-105 transition-transform">
                <span className="text-lg font-bold text-white">GT</span>
              </div>
              <div>
                <div className="text-lg font-bold">
                  <GradientText variant="h3">GTIXT</GradientText>
                </div>
                {variant === 'admin' && (
                  <div className="text-xs text-slate-400">Admin Portal</div>
                )}
              </div>
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        active
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {item.icon && <RealIcon name={item.icon} size={16} className="mr-2 align-text-bottom" alt={item.label} />}
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Admin/Logout */}
            {variant === 'public' ? (
              <Link
                href="/admin/login"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/30 active:scale-95"
              >
                <span className="inline-flex items-center gap-2">
                  <RealIcon name="shield" size={16} alt="Admin" />
                  Admin
                </span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  fetch('/api/internal/auth/logout/', { method: 'POST', credentials: 'include' })
                    .then(() => window.location.href = '/admin/login')
                }}
                className="px-4 py-2 bg-slate-800/50 border border-red-500/40 hover:bg-red-900/30 text-red-300 rounded-lg font-medium transition-all active:scale-95"
              >
                <span className="inline-flex items-center gap-2">
                  <RealIcon name="review" size={16} alt="Logout" />
                  Logout
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/30 backdrop-blur-lg border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link href={variant === 'admin' ? '/admin' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">GT</span>
            </div>
            <span className="text-lg font-bold">
              <GradientText variant="h3">GTIXT</GradientText>
            </span>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-300 hover:text-cyan-300 transition-colors"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="bg-slate-900/95 backdrop-blur-lg border-t border-cyan-500/20 max-h-[80vh] overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    block px-4 py-3 text-sm font-medium transition-all
                    ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border-l-4 border-cyan-500'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-cyan-300'
                    }
                  `}
                >
                  {item.icon && <RealIcon name={item.icon} size={16} className="mr-2 align-text-bottom" alt={item.label} />}
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Mobile Action Button */}
            <div className="p-4 border-t border-cyan-500/20">
              {variant === 'public' ? (
                <Link
                  href="/admin/login"
                  className="block text-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium"
                >
                  <span className="inline-flex items-center gap-2">
                    <RealIcon name="shield" size={16} alt="Admin Portal" />
                    Admin Portal
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    fetch('/api/internal/auth/logout/', { method: 'POST', credentials: 'include' })
                      .then(() => window.location.href = '/admin/login')
                  }}
                  className="w-full px-4 py-2 bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg font-medium"
                >
                  <span className="inline-flex items-center gap-2">
                    <RealIcon name="review" size={16} alt="Logout" />
                    Logout
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  )
}

/**
 * AdminNavigation - Pre-configured for admin pages
 */
export function AdminNavigation() {
  return <UnifiedNavigation variant="admin" />
}

/**
 * PublicNavigation - Pre-configured for public pages
 */
export function PublicNavigation() {
  return <UnifiedNavigation variant="public" />
}
