'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Code2, FileText, Menu, Search, Sparkles, X } from 'lucide-react'

type NavVariant = 'admin' | 'public'

type NavItem = {
  href: string
  label: string
}

type SecondaryItem = {
  href: string
  label: string
  Icon: React.ElementType
}

type UnifiedNavigationProps = {
  variant?: NavVariant
  className?: string
}

const PUBLIC_PRIMARY_ITEMS: NavItem[] = [
  { href: '/index', label: 'Index' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/firms', label: 'Firms' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/simulator', label: 'Simulator' },
  { href: '/radar', label: 'Radar' },
  { href: '/industry-map', label: 'Industry Map' },
]

const PUBLIC_SECONDARY_ITEMS: SecondaryItem[] = [
  { href: '/research', label: 'Research', Icon: BookOpen },
  { href: '/api-docs', label: 'API', Icon: Code2 },
  { href: '/methodology', label: 'Methodology', Icon: FileText },
]

const PUBLIC_MOBILE_ITEMS: NavItem[] = [
  ...PUBLIC_PRIMARY_ITEMS,
  { href: '/research', label: 'Research' },
  { href: '/api-docs', label: 'API' },
  { href: '/methodology', label: 'Methodology' },
]

const ADMIN_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/integrity', label: 'Integrity' },
  { href: '/admin/agents/policies', label: 'Policies' },
  { href: '/admin/firms', label: 'Firms' },
  { href: '/admin/users', label: 'Users' },
]

const PUBLIC_COMMAND_ITEMS: NavItem[] = [
  ...PUBLIC_PRIMARY_ITEMS,
  ...PUBLIC_SECONDARY_ITEMS.map((item) => ({ href: item.href, label: item.label })),
  { href: '/verify', label: 'Verify' },
  { href: '/login', label: 'Sign In' },
]

function isItemActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function navLinkClass(active: boolean) {
  return active
    ? 'text-white bg-cyan-500/[0.14] border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.18)]'
    : 'text-slate-300 border-transparent hover:text-white hover:bg-white/[0.07]'
}

function adminLinkClass(active: boolean) {
  return active
    ? 'border-cyan-500/40 bg-cyan-500/10 text-white'
    : 'border-transparent text-slate-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white'
}

export function UnifiedNavigation({ variant = 'public', className = '' }: UnifiedNavigationProps) {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showQuickDock, setShowQuickDock] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setPaletteOpen(false)
    setQuery('')
  }, [currentPath])

  useEffect(() => {
    if (variant !== 'public') return

    const onKeyDown = (event: KeyboardEvent) => {
      const wantsPalette = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (wantsPalette) {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }

      if (event.key === 'Escape') {
        setPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [variant])

  useEffect(() => {
    if (variant !== 'public') return

    const onScroll = () => {
      const y = window.scrollY
      setShowQuickDock(y > 140)
      setScrolled(y > 12)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant])

  const filteredCommandItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return PUBLIC_COMMAND_ITEMS
    return PUBLIC_COMMAND_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(normalized) || item.href.toLowerCase().includes(normalized)
    )
  }, [query])

  const homeHref = variant === 'admin' ? '/admin' : '/'
  const homeLabel = variant === 'admin' ? 'GTIXT Admin' : 'GTIXT'

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.09] bg-[#07111e]/95 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-md'
          : 'border-b border-white/[0.06] bg-[#0A1A2F]/90 backdrop-blur-sm'
      } ${className}`}>
        {/* Gradient accent line at top */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent pointer-events-none" />
        <div className={`mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 md:px-10 lg:px-20 xl:px-24 transition-all duration-300 ${
          scrolled ? 'h-[60px]' : 'h-[72px]'
        }`}>
          {variant === 'admin' ? (
            <>
              <Link href={homeHref} className="group flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(34,211,238,0.35)] text-white font-bold text-sm">
                  G
                </span>
                <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent text-lg font-bold tracking-[0.06em]">
                  {homeLabel}
                </span>
              </Link>
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Admin navigation">
                {ADMIN_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${adminLinkClass(isItemActive(currentPath, item.href))}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </>
          ) : (
            <div className="hidden w-full items-center lg:flex">
              <div className="mr-8 flex min-w-[140px] items-center gap-2">
                <Link href={homeHref} className="group flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(34,211,238,0.4)] text-white font-bold text-sm">
                    G
                  </span>
                  <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent text-lg font-bold tracking-[0.06em] group-hover:to-cyan-300 transition-all">
                    {homeLabel}
                  </span>
                </Link>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <nav
                  className="flex items-center gap-0.5 rounded-2xl border border-white/[0.12] bg-white/[0.04] p-1 shadow-[0_10px_35px_rgba(0,0,0,0.28),0_0_0_1px_rgba(34,211,238,0.04)]"
                  aria-label="Primary navigation"
                >
                  {PUBLIC_PRIMARY_ITEMS.map((item) => {
                    const active = isItemActive(currentPath, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${navLinkClass(active)}`}
                      >
                        {item.label}
                        {active && (
                          <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-cyan-400 opacity-80" />
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <nav className="ml-8 hidden items-center gap-2 xl:flex" aria-label="Secondary actions">
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Search</span>
                  <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</span>
                </button>

                {PUBLIC_SECONDARY_ITEMS.map(({ href, label, Icon }) => {
                  const active = isItemActive(currentPath, href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        active ? 'text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </Link>
                  )
                })}

                <Link
                  href="/login"
                  className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-white/50"
                >
                  Sign In
                </Link>

                <Link
                  href="/index"
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-500 bg-blue-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-blue-400"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Explore Firms</span>
                </Link>

                <Link
                  href="/rankings"
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 transition-colors hover:border-white/35 hover:text-white"
                >
                  View Rankings
                </Link>

                <Link
                  href="/analytics"
                  className="rounded-md border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200 transition-colors hover:border-cyan-300 hover:text-cyan-100"
                >
                  Open Analytics
                </Link>
              </nav>
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-white/20 p-2 text-slate-100 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/[0.06] bg-[#0A1A2F] px-6 pb-4 pt-3 lg:hidden">
            {variant === 'public' ? (
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {PUBLIC_MOBILE_ITEMS.map((item) => {
                  const active = isItemActive(currentPath, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-md px-2.5 py-2 text-sm transition-colors ${
                        active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md border border-white/30 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/firms"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md border border-blue-500 bg-blue-500 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white"
                  >
                    Explore Firms
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/rankings"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md border border-white/25 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-100"
                  >
                    View Rankings
                  </Link>
                  <Link
                    href="/analytics"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md border border-cyan-400/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200"
                  >
                    Open Analytics
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    setPaletteOpen(true)
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search
                </button>
              </nav>
            ) : (
              <nav className="flex flex-col gap-2" aria-label="Admin navigation mobile">
                {ADMIN_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${adminLinkClass(isItemActive(currentPath, item.href))}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        )}
      </header>
      <div className="h-[72px]" />

      {variant === 'public' && showQuickDock && !mobileOpen && (
        <div className="fixed bottom-4 left-1/2 z-[55] hidden -translate-x-1/2 lg:block">
          <nav
            className="flex items-center gap-1 rounded-2xl border border-white/15 bg-[#0A1A2F]/90 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md"
            aria-label="Quick switch navigation"
          >
            {PUBLIC_PRIMARY_ITEMS.map((item) => {
              const active = isItemActive(currentPath, item.href)
              return (
                <Link
                  key={`quick-${item.href}`}
                  href={item.href}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${navLinkClass(active)}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {variant === 'public' && paletteOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <div
            className="mx-auto mt-24 w-[92%] max-w-2xl overflow-hidden rounded-2xl border border-white/12 bg-[#0D223B] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="Search pages, API, methodology..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded-md border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[55vh] overflow-auto p-2">
              {filteredCommandItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setPaletteOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    isItemActive(currentPath, item.href)
                      ? 'bg-white/12 text-white'
                      : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-slate-400">{item.href}</span>
                </Link>
              ))}

              {filteredCommandItems.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-400">No result for this query.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function PublicNavigation() {
  return <UnifiedNavigation variant="public" />
}

export function AdminNavigation() {
  return <UnifiedNavigation variant="admin" />
}

export default UnifiedNavigation
