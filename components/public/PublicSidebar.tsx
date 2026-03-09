'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Trophy, Building2, Network, BarChart3, Database, FileText, Code2, Sigma, ShieldCheck } from 'lucide-react'

const items = [
  { name: 'Dashboard', href: '/index', icon: LayoutDashboard },
  { name: 'Rankings', href: '/rankings', icon: Trophy },
  { name: 'Firms', href: '/firms', icon: Building2 },
  { name: 'Industry Galaxy', href: '/industry-map', icon: Network },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Data', href: '/data', icon: Database },
  { name: 'Research', href: '/research', icon: FileText },
  { name: 'API', href: '/api-docs', icon: Code2 },
  { name: 'Methodology', href: '/methodology', icon: Sigma },
  { name: 'Verification', href: '/verify', icon: ShieldCheck },
]

export default function PublicSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block lg:w-72">
      <div className="sticky top-24 rounded-2xl border border-white/[0.08] bg-[#0B1C2B]/70 backdrop-blur-xl p-4">
        <div className="px-3 pb-3 mb-3 border-b border-white/[0.06]">
          <div className="text-white text-lg font-bold">GTIXT</div>
          <div className="text-xs text-dark-400">Global Prop Trading Intelligence Index</div>
        </div>

        <nav className="space-y-1.5">
          {items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-primary-500/20 to-primary-800/20 border border-primary-500/30 text-white shadow-[0_0_20px_rgba(0,212,198,0.15)]'
                    : 'text-dark-300 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.07]'
                ].join(' ')}
              >
                <item.icon className={[
                  'w-4 h-4',
                  active ? 'text-primary-400' : 'text-dark-400 group-hover:text-primary-400'
                ].join(' ')} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
