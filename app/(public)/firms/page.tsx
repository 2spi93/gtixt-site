'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GlassCard, GradientText } from '@/components/design-system/GlassComponents'

type DirectoryFirm = {
  slug: string
  name: string
  jurisdiction: string
  score: number
  payoutReliability: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  externalCoverage: {
    activeSources: number
    sourceNames: string[]
  }
}

type SortKey = 'name' | 'score' | 'payout'
type CoverageFilter = 'all' | 'with' | 'without'

export default function FirmsPage() {
  const [firms, setFirms] = useState<DirectoryFirm[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [jurisdiction, setJurisdiction] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const [coverage, setCoverage] = useState<CoverageFilter>('all')

  useEffect(() => {
    let active = true

    const loadDirectory = async () => {
      try {
        setLoading(true)
        setLoadError(null)

        const response = await fetch('/api/rankings?limit=500', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Directory API returned ${response.status}`)
        }

        const payload = await response.json()
        const rows = Array.isArray(payload?.data) ? payload.data : []

        const nextFirms: DirectoryFirm[] = rows.map((row: Record<string, unknown>) => ({
          slug: String(row.slug || '').trim(),
          name: String(row.name || 'Unknown firm').trim(),
          jurisdiction: String(row.jurisdiction || 'Global').trim(),
          score: Number(row.score || 0),
          payoutReliability: Number(row.payoutReliability || 0),
          risk: row.risk === 'LOW' || row.risk === 'MEDIUM' || row.risk === 'HIGH' ? row.risk : 'MEDIUM',
          externalCoverage: (() => {
            const ec = row.externalCoverage as Record<string, unknown> | undefined
            return {
              activeSources: Number(ec?.activeSources || 0),
              sourceNames: Array.isArray(ec?.sourceNames) ? (ec.sourceNames as unknown[]).map((value) => String(value)) : [],
            }
          })(),
        }))

        if (active) {
          setFirms(nextFirms)
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load firms directory')
          setFirms([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDirectory()
    return () => {
      active = false
    }
  }, [])

  const jurisdictions = useMemo(() => {
    const values = new Set<string>()
    firms.forEach((firm) => values.add(firm.jurisdiction))
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
  }, [firms])

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return firms
      .filter((firm) => {
        const matchesSearch =
          !normalizedSearch ||
          firm.name.toLowerCase().includes(normalizedSearch) ||
          firm.jurisdiction.toLowerCase().includes(normalizedSearch)
        const matchesJurisdiction = jurisdiction === 'all' || firm.jurisdiction === jurisdiction
        const hasCoverage = firm.externalCoverage.activeSources > 0
        const matchesCoverage =
          coverage === 'all' ||
          (coverage === 'with' && hasCoverage) ||
          (coverage === 'without' && !hasCoverage)
        return matchesSearch && matchesJurisdiction && matchesCoverage
      })
      .sort((left, right) => {
        if (sortBy === 'name') return left.name.localeCompare(right.name)
        if (sortBy === 'payout') return right.payoutReliability - left.payoutReliability
        return right.score - left.score
      })
  }, [coverage, firms, jurisdiction, search, sortBy])

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inst-client-section-head">
          <p className="inst-client-kicker">Live Directory</p>
          <h1 className="inst-client-title">
            <GradientText variant="h1">Firms Directory</GradientText>
          </h1>
          <p className="inst-client-subtitle">
            Live directory from GTIXT snapshots. Filter by jurisdiction, risk, and evidence coverage.
          </p>
        </motion.div>

        <section className="gx-interactive-card rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-4 md:p-5">
          <div className="inst-client-section-head !mb-4">
            <p className="inst-client-kicker">Screening</p>
            <h2 className="inst-client-title">Filter Directory</h2>
          </div>
          <GlassCard variant="light">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <RealIcon name="research" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search firms or jurisdictions..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="relative">
              <select
                aria-label="Filter by jurisdiction"
                value={jurisdiction}
                onChange={(event) => setJurisdiction(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {jurisdictions.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? 'All Jurisdictions' : item}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
            </div>

            <div className="relative">
              <select
                aria-label="Sort firms"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="score">Sort by Score</option>
                <option value="payout">Sort by Payout Reliability</option>
                <option value="name">Sort by Name</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
            </div>

            <div className="relative">
              <select
                aria-label="Filter by external coverage"
                value={coverage}
                onChange={(event) => setCoverage(event.target.value as CoverageFilter)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Coverage</option>
                <option value="with">With External Coverage</option>
                <option value="without">Without External Coverage</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            {loading ? 'Loading live directory...' : `Showing ${filtered.length} of ${firms.length} firms in GTIXT directory.`}
          </p>
          {loadError && (
            <p className="mt-2 text-xs text-red-300">Live data unavailable: {loadError}</p>
          )}
          </GlassCard>
        </section>

        <section className="gx-interactive-card rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-4 md:p-5">
          <div className="inst-client-section-head !mb-4">
            <p className="inst-client-kicker">Output</p>
            <h2 className="inst-client-title">Institution List</h2>
          </div>
          <div className="overflow-x-auto rounded-xl">
        <GlassCard variant="light" className="overflow-hidden p-0 min-w-[1080px]">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/30 border-b border-cyan-500/20 text-slate-300 text-sm font-semibold">
            <div className="col-span-3">Firm</div>
            <div className="col-span-3">Jurisdiction</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-2">External Coverage</div>
            <div className="col-span-1">Payout</div>
            <div className="col-span-1 text-right">Score</div>
          </div>

          <div className="divide-y divide-cyan-500/10">
            {filtered.map((firm, index) => (
              <motion.div
                key={firm.slug || `${firm.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.25) }}
              >
                <Link href={`/firms/${firm.slug}`} className="gx-pressable grid grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-800/35 transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border border-cyan-500/25 bg-cyan-500/10 flex items-center justify-center text-white font-semibold">
                      {firm.name[0] || 'F'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{firm.name}</div>
                      <div className="text-xs text-slate-400">View firm profile</div>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center text-slate-300">{firm.jurisdiction}</div>
                  <div className="col-span-2 flex items-center text-slate-300">{firm.risk}</div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                        firm.externalCoverage.activeSources > 0
                          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                          : 'border-white/10 bg-white/[0.04] text-slate-400'
                      }`}>
                        {firm.externalCoverage.activeSources}/3 active
                      </span>
                      {firm.externalCoverage.sourceNames.slice(0, 1).map((source) => (
                        <span key={source} className="px-2 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-[11px] uppercase tracking-[0.14em]">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center text-slate-300">
                    {firm.payoutReliability > 0 ? `${firm.payoutReliability.toFixed(1)}` : 'N/A'}
                  </div>
                  <div className="col-span-1 flex items-center justify-end text-white font-semibold">{firm.score.toFixed(1)}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </GlassCard>
          </div>
        </section>

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <RealIcon name="firms" size={44} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No firms match the current filters</h3>
            <p className="text-slate-400">Try another jurisdiction, search term, or sorting rule.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
