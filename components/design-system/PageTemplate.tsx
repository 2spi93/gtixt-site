/**
 * PageTemplate - Unified Design System Layout
 * Apply globally to all pages for consistent styling and behavior
 */

'use client'

import React from 'react'
import { GlassGrid, GradientText } from './GlassComponents'

interface PageTemplateProps {
  children: React.ReactNode
  title?: React.ReactNode
  subtitle?: string
  icon?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  gradient?: boolean
  variant?: 'light' | 'dark' | 'glass'
}

export function PageTemplate({
  children,
  title,
  subtitle,
  icon,
  breadcrumbs,
  className = '',
  maxWidth = 'xl',
  gradient = false,
  variant = 'dark',
}: PageTemplateProps) {
  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'w-full',
  }

  const bgVariant = {
    light:
      'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900',
    dark: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50',
    glass:
      'bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-slate-950 text-slate-50 backdrop-blur-lg',
  }

  return (
    <div className={`min-h-screen ${bgVariant[variant]}`}>
      {/* Navigation Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="px-4 sm:px-6 lg:px-8 py-4 bg-slate-900/30 backdrop-blur border-b border-cyan-500/20">
          <div className={`${maxWidthMap[maxWidth]} mx-auto`}>
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-400">/</span>}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-slate-300">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </ol>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className={`${maxWidthMap[maxWidth]} mx-auto`}>
          {/* Header Section */}
          {(title || subtitle) && (
            <header className="mb-8 pb-8 border-b border-cyan-500/20">
              <div className="flex items-start gap-4">
                {icon && (
                  <div className="text-cyan-400 text-4xl mt-1">{icon}</div>
                )}
                <div className="flex-1">
                  {title && (
                    <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                      {gradient ? (
                        <GradientText variant="h1">{title}</GradientText>
                      ) : (
                        <span className="text-slate-50">{title}</span>
                      )}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-lg text-slate-400 max-w-2xl">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Main Content with default styling */}
          <div className={`space-y-8 ${className}`}>{children}</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20 bg-slate-950/50 backdrop-blur">
        <div className={`${maxWidthMap[maxWidth]} mx-auto`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">
                GTIXT
              </h3>
              <p className="text-sm text-slate-400">
                Global Prop Firm Index & Intelligence
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="/rankings" className="hover:text-cyan-400 transition">
                    Rankings
                  </a>
                </li>
                <li>
                  <a href="/analytics" className="hover:text-cyan-400 transition">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="/data" className="hover:text-cyan-400 transition">
                    Data
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">
                Resources
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="/methodology" className="hover:text-cyan-400 transition">
                    Methodology
                  </a>
                </li>
                <li>
                  <a href="/research" className="hover:text-cyan-400 transition">
                    Research
                  </a>
                </li>
                <li>
                  <a href="/api-docs" className="hover:text-cyan-400 transition">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            {/* Verification */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">
                Verification
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="/verify" className="hover:text-cyan-400 transition">
                    Verify Score
                  </a>
                </li>
                <li>
                  <a href="/firms" className="hover:text-cyan-400 transition">
                    All Firms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-cyan-500/10 flex justify-between items-center text-sm text-slate-500">
            <p>&copy; 2026 GTIXT. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-cyan-400 transition">
                Privacy
              </a>
              <a href="/terms" className="hover:text-cyan-400 transition">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * AdminPageTemplate - Specialized template for admin pages
 */
interface AdminPageTemplateProps extends PageTemplateProps {
  actions?: React.ReactNode
  sidebar?: React.ReactNode
}

export function AdminPageTemplate({
  children,
  title,
  subtitle,
  actions,
  sidebar,
  icon,
  ...props
}: AdminPageTemplateProps) {
  return (
    <PageTemplate
      title={title}
      subtitle={subtitle}
      icon={icon}
      variant="glass"
      gradient={true}
      {...props}
    >
      {/* Admin Header with Actions */}
      {(title || actions) && (
        <div className="flex justify-between items-start mb-8">
          <div />
          {actions && (
            <div className="flex gap-4 items-center">{actions}</div>
          )}
        </div>
      )}

      {/* Two-column layout for admin */}
      {sidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">{sidebar}</aside>
          <main className="lg:col-span-3">{children}</main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </PageTemplate>
  )
}
