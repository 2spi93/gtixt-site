import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Code2, FileText, Menu, Search, Sparkles, X } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href: string
}

interface InstitutionalHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

type NavItem = {
  href: string
  label: string
}

const PRIMARY_ITEMS: NavItem[] = [
  { href: '/index-live', label: 'Index' },
  { href: '/rankings-segmented', label: 'Rankings' },
  { href: '/firm/1', label: 'Firms' },
  { href: '/integrity', label: 'Analytics' },
  { href: '/universe-index', label: 'Industry Map' },
]

const SECONDARY_ITEMS = [
  { href: '/reports', label: 'Research', Icon: BookOpen },
  { href: '/api-docs', label: 'API', Icon: Code2 },
  { href: '/methodology', label: 'Methodology', Icon: FileText },
]

const COMMAND_ITEMS: NavItem[] = [
  ...PRIMARY_ITEMS,
  { href: '/reports', label: 'Research' },
  { href: '/api-docs', label: 'API' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/validation', label: 'Verify' },
  { href: '/admin/login', label: 'Sign In' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/firm/1') return pathname.startsWith('/firm/')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function InstitutionalHeader({ breadcrumbs = [] }: InstitutionalHeaderProps) {
  const router = useRouter()
  const currentPath = router.pathname
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1100 : false))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showQuickDock, setShowQuickDock] = useState(() => (typeof window !== 'undefined' ? window.scrollY > 140 : false))

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMobileOpen(false)
      setPaletteOpen(false)
      setQuery('')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [currentPath])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowQuickDock(window.scrollY > 140)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1100)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return COMMAND_ITEMS
    return COMMAND_ITEMS.filter((item) => item.label.toLowerCase().includes(normalized) || item.href.toLowerCase().includes(normalized))
  }, [query])

  return (
    <>
      <header style={styles.header}>
        <div style={styles.container}>
          <Link href="/" style={styles.brand}>
            GTIXT
          </Link>

          {!isMobile && <span style={styles.liveBadge}>Next-Gen Nav</span>}

          <div style={{ ...styles.desktopFrame, display: isMobile ? 'none' : 'flex' }}>
            <nav style={styles.primaryDock} aria-label="Primary navigation">
              {PRIMARY_ITEMS.map((item) => {
                const active = isActive(currentPath, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={active ? { ...styles.primaryItem, ...styles.primaryItemActive } : styles.primaryItem}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <nav style={{ ...styles.secondaryNav, display: isMobile ? 'none' : 'flex' }} aria-label="Secondary actions">
            <button type="button" onClick={() => setPaletteOpen(true)} style={styles.searchBtn}>
              <Search size={14} />
              <span>Search</span>
              <span style={styles.kbd}>Ctrl+K</span>
            </button>

            {SECONDARY_ITEMS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} style={styles.secondaryItem}>
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            ))}

            <Link href="/admin/login" style={styles.signInBtn}>
              Sign In
            </Link>

            <Link href="/index-live" style={styles.exploreBtn}>
              <Sparkles size={14} />
              <span>Explore Index</span>
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            style={{ ...styles.mobileToggle, display: isMobile ? 'inline-flex' : 'none' }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {isMobile && mobileOpen && (
          <div style={{ ...styles.mobilePanel, display: 'flex' }}>
            {COMMAND_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={isActive(currentPath, item.href) ? { ...styles.mobileItem, ...styles.mobileItemActive } : styles.mobileItem}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {breadcrumbs.length > 0 && (
        <div style={styles.breadcrumbWrap}>
          <div style={{ ...styles.container, height: 'auto', minHeight: '38px' }}>
            <nav aria-label="Breadcrumb" style={styles.breadcrumbNav}>
              <Link href="/" style={styles.breadcrumbLink}>Home</Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.href}-${index}`} style={styles.breadcrumbItem}>
                  <span style={styles.breadcrumbSep}>/</span>
                  {index === breadcrumbs.length - 1 ? (
                    <span style={styles.breadcrumbCurrent}>{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} style={styles.breadcrumbLink}>{crumb.label}</Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}

      {showQuickDock && !isMobile && (
        <div style={styles.quickDockWrap}>
          <nav style={styles.quickDock} aria-label="Quick switch navigation">
            {PRIMARY_ITEMS.map((item) => {
              const active = isActive(currentPath, item.href)
              return (
                <Link
                  key={`q-${item.href}`}
                  href={item.href}
                  style={active ? { ...styles.quickItem, ...styles.quickItemActive } : styles.quickItem}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {paletteOpen && (
        <div style={styles.paletteOverlay} onClick={() => setPaletteOpen(false)}>
          <div style={styles.paletteCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.paletteHead}>
              <Search size={15} color="#94A3B8" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search page..."
                style={styles.paletteInput}
              />
              <button type="button" onClick={() => setPaletteOpen(false)} style={styles.paletteEsc}>
                ESC
              </button>
            </div>
            <div style={styles.paletteList}>
              {filteredCommands.map((item) => (
                <Link
                  key={`p-${item.href}`}
                  href={item.href}
                  onClick={() => setPaletteOpen(false)}
                  style={isActive(currentPath, item.href) ? { ...styles.paletteItem, ...styles.paletteItemActive } : styles.paletteItem}
                >
                  <span>{item.label}</span>
                  <span style={styles.palettePath}>{item.href}</span>
                </Link>
              ))}
              {filteredCommands.length === 0 && <div style={styles.paletteEmpty}>No results</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: '#0A1A2F',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(6px)',
  },
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '0 80px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  brand: {
    color: '#FFFFFF',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1.05rem',
    letterSpacing: '0.07em',
    minWidth: '110px',
  },
  liveBadge: {
    color: '#BFDBFE',
    border: '1px solid rgba(96, 165, 250, 0.45)',
    background: 'rgba(96, 165, 250, 0.14)',
    borderRadius: '8px',
    fontSize: '0.62rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    padding: '4px 7px',
    marginRight: '8px',
    whiteSpace: 'nowrap',
  },
  desktopFrame: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
  },
  primaryDock: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.04)',
    padding: '4px',
  },
  primaryItem: {
    color: '#CBD5E1',
    textDecoration: 'none',
    fontSize: '0.86rem',
    fontWeight: 500,
    padding: '7px 12px',
    borderRadius: '10px',
    border: '1px solid transparent',
  },
  primaryItemActive: {
    color: '#FFFFFF',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  secondaryNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#CBD5E1',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    background: 'transparent',
    padding: '6px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  kbd: {
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    padding: '1px 4px',
    fontSize: '0.62rem',
    color: '#94A3B8',
  },
  secondaryItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: '#CBD5E1',
    textDecoration: 'none',
    fontSize: '0.76rem',
    fontWeight: 500,
    padding: '6px 7px',
  },
  signInBtn: {
    color: '#FFFFFF',
    textDecoration: 'none',
    fontSize: '0.74rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    padding: '7px 10px',
  },
  exploreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: '#FFFFFF',
    textDecoration: 'none',
    fontSize: '0.74rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: '1px solid #3B82F6',
    background: '#3B82F6',
    borderRadius: '8px',
    padding: '7px 10px',
  },
  mobileToggle: {
    display: 'none',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
  },
  mobilePanel: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: '#0A1A2F',
    padding: '10px 16px 12px',
    display: 'none',
    flexDirection: 'column',
    gap: '4px',
  },
  mobileItem: {
    color: '#CBD5E1',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '9px 10px',
    fontSize: '0.9rem',
  },
  mobileItemActive: {
    color: '#FFFFFF',
    background: 'rgba(255,255,255,0.12)',
  },
  breadcrumbWrap: {
    background: 'rgba(10, 26, 47, 0.9)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  breadcrumbNav: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
    fontSize: '0.76rem',
    color: '#94A3B8',
  },
  breadcrumbLink: {
    color: '#94A3B8',
    textDecoration: 'none',
  },
  breadcrumbItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  breadcrumbSep: {
    color: '#64748B',
  },
  breadcrumbCurrent: {
    color: '#E2E8F0',
  },
  quickDockWrap: {
    position: 'fixed',
    bottom: '14px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 980,
    display: 'block',
  },
  quickDock: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '16px',
    background: 'rgba(10, 26, 47, 0.9)',
    backdropFilter: 'blur(10px)',
    padding: '6px',
    boxShadow: '0 18px 45px rgba(0,0,0,0.35)',
  },
  quickItem: {
    color: '#CBD5E1',
    textDecoration: 'none',
    fontSize: '0.74rem',
    fontWeight: 600,
    borderRadius: '10px',
    border: '1px solid transparent',
    padding: '6px 10px',
  },
  quickItemActive: {
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.12)',
  },
  paletteOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1200,
    background: 'rgba(2, 6, 23, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '96px',
  },
  paletteCard: {
    width: 'min(720px, 92vw)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#0D223B',
    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
  },
  paletteHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '10px 12px',
  },
  paletteInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#FFFFFF',
    fontSize: '0.88rem',
  },
  paletteEsc: {
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#CBD5E1',
    borderRadius: '6px',
    fontSize: '0.65rem',
    padding: '3px 6px',
    cursor: 'pointer',
  },
  paletteList: {
    maxHeight: '56vh',
    overflow: 'auto',
    padding: '6px',
  },
  paletteItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#E2E8F0',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '9px 10px',
    fontSize: '0.86rem',
  },
  paletteItemActive: {
    background: 'rgba(255,255,255,0.12)',
    color: '#FFFFFF',
  },
  palettePath: {
    color: '#94A3B8',
    fontSize: '0.74rem',
  },
  paletteEmpty: {
    color: '#94A3B8',
    padding: '10px',
    fontSize: '0.86rem',
  },
}
