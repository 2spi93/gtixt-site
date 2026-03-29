'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ScoreBar from '@/components/public/ScoreBar'
import RiskBadge from '@/components/public/RiskBadge'
import ShieldBadge from '@/components/public/ShieldBadge'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GlassCard, GradientText } from '@/components/design-system/GlassComponents'

type RankingFirm = {
  rank: number
  name: string
  slug: string
  score: number
  payoutReliability: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  jurisdiction: string
  trend?: number
  externalCoverage?: {
    activeSources: number
    sourceNames: string[]
  }
}

type CoverageFilter = 'all' | 'with' | 'without'

function normalizeJurisdictionCode(jurisdiction: string): string {
  const jurisdictionValue = (jurisdiction || '').toUpperCase()
  if (jurisdictionValue === 'UNITED KINGDOM') return 'UK'
  if (jurisdictionValue === 'UNITED STATES') return 'US'
  if (jurisdictionValue === 'CZECH REPUBLIC') return 'CZ'
  if (jurisdictionValue === 'UNITED ARAB EMIRATES') return 'AE'
  if (jurisdictionValue === 'AUSTRALIA') return 'AU'
  return jurisdictionValue
}

function buildWhyRanked(firm: RankingFirm): string[] {
  const reasons: string[] = []
  if (firm.score >= 80) reasons.push('Strong composite score')
  if (firm.payoutReliability >= 75) reasons.push('High payout reliability')
  if (firm.risk === 'LOW') reasons.push('Low risk regime')
  if ((firm.externalCoverage?.activeSources || 0) >= 2) reasons.push('Multi-source intelligence')
  if (reasons.length === 0) reasons.push('Under active benchmark monitoring')
  return reasons.slice(0, 2)
}

export default function RankingsPage() {
  const [firms, setFirms] = useState<RankingFirm[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterJurisdiction, setFilterJurisdiction] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterCoverage, setFilterCoverage] = useState<CoverageFilter>('all')
  const [rowLimit, setRowLimit] = useState(80)
  const [compareSlugs, setCompareSlugs] = useState<string[]>([])

  useEffect(() => {
    let active = true

    const loadRankings = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const response = await fetch('/api/rankings?limit=500', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Rankings API returned ${response.status}`)
        }

        const payload = await response.json()
        const nextRows = Array.isArray(payload?.data) ? payload.data : []

        if (active) {
          setFirms(nextRows)
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load rankings')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRankings()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const initialJurisdiction = params.get('jurisdiction')
    if (!initialJurisdiction) return
    const normalized = initialJurisdiction.toUpperCase()
    const allowed = new Set(['UK', 'US', 'CZ', 'AE', 'AU'])
    if (allowed.has(normalized)) {
      setFilterJurisdiction(normalized)
    }
  }, [])

  const filteredFirms = firms.filter(firm => {
    const jurisdictionCode = normalizeJurisdictionCode(firm.jurisdiction)
    const matchesSearch = firm.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesJurisdiction = filterJurisdiction === 'all' || jurisdictionCode === filterJurisdiction
    const matchesRisk = filterRisk === 'all' || firm.risk === filterRisk
    const hasCoverage = (firm.externalCoverage?.activeSources || 0) > 0
    const matchesCoverage =
      filterCoverage === 'all' ||
      (filterCoverage === 'with' && hasCoverage) ||
      (filterCoverage === 'without' && !hasCoverage)
    return matchesSearch && matchesJurisdiction && matchesRisk && matchesCoverage
  })

  useEffect(() => {
    setRowLimit(80)
  }, [searchTerm, filterJurisdiction, filterRisk, filterCoverage])

  const selectedCompareFirms = compareSlugs
    .map((slug) => firms.find((firm) => firm.slug === slug))
    .filter((firm): firm is RankingFirm => Boolean(firm))

  const rankingStats = useMemo(() => {
    const averageScore = firms.length ? firms.reduce((sum, firm) => sum + firm.score, 0) / firms.length : 0
    const lowRiskCount = firms.filter((firm) => firm.risk === 'LOW').length
    const coveredCount = firms.filter((firm) => (firm.externalCoverage?.activeSources || 0) > 0).length
    return {
      averageScore,
      lowRiskCount,
      coveredCount,
    }
  }, [firms])

  function toggleCompare(slug: string) {
    setCompareSlugs((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug)
      }
      if (current.length >= 4) {
        return [...current.slice(1), slug]
      }
      return [...current, slug]
    })
  }

  const visibleFirms = filteredFirms.slice(0, rowLimit)
  const hasMoreRows = filteredFirms.length > rowLimit

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="mx-auto max-w-[1480px] px-6 py-12 space-y-8">
          {/* Header - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inst-client-section-head"
          >
            <p className="inst-client-kicker">Committee Benchmark Board</p>
            <h1 className="inst-client-title">
              <span className="text-slate-50">Global </span>
              <GradientText variant="h1">Rankings</GradientText>
            </h1>
            <p className="inst-client-subtitle">
              Institutional ranking of monitored firms, calibrated for shortlist screening, committee review, and comparative diligence.
            </p>
          </motion.div>

          <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <div className="xl:col-span-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
              <p className="inst-client-kicker text-cyan-200">Ranking Mandate</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">A screening surface for investment-style comparison, not a decorative leaderboard.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200">Use this table to identify resilient institutions, compare benchmark posture, and isolate firms that warrant deeper diligence.</p>
            </div>
            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Universe</p>
              <p className="mt-2 text-2xl font-semibold text-white">{firms.length}</p>
              <p className="mt-1 text-sm text-slate-300">active benchmarked firms</p>
            </div>
            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Average Score</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{rankingStats.averageScore.toFixed(1)}</p>
              <p className="mt-1 text-sm text-slate-300">composite benchmark</p>
            </div>
            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Coverage</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-200">{rankingStats.coveredCount}</p>
              <p className="mt-1 text-sm text-slate-300">with external intelligence</p>
            </div>
          </section>

          {/* Filters */}
          <section className="sticky top-4 z-20 gx-interactive-card rounded-2xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl p-4 md:p-5">
            <div className="inst-client-section-head !mb-4">
              <p className="inst-client-kicker">Committee Screening</p>
              <h2 className="inst-client-title">Refine The Benchmark Universe</h2>
            </div>
            <GlassCard variant="light">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <RealIcon name="research" size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-60" />
                  <input
                    type="text"
                    placeholder="Search firms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Jurisdiction Filter */}
              <div className="relative">
                <select
                  aria-label="Filter by jurisdiction"
                  value={filterJurisdiction}
                  onChange={(e) => setFilterJurisdiction(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                >
                  <option value="all">All Jurisdictions</option>
                  <option value="UK">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CZ">Czech Republic</option>
                  <option value="AE">UAE</option>
                  <option value="AU">Australia</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
              </div>

              {/* Risk Filter */}
              <div className="relative">
                <select
                  aria-label="Filter by risk level"
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
              </div>

              <div className="relative">
                <select
                  aria-label="Filter by external coverage"
                  value={filterCoverage}
                  onChange={(e) => setFilterCoverage(e.target.value as CoverageFilter)}
                  className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                >
                  <option value="all">All Coverage</option>
                  <option value="with">With External Coverage</option>
                  <option value="without">Without External Coverage</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
              </div>
            </div>

            <div className="text-slate-400 text-sm mt-4">
              {loading ? 'Loading benchmark board...' : `Displaying ${filteredFirms.length} of ${firms.length} monitored firms`}
            </div>
            {loadError && (
              <div className="mt-3 text-xs text-red-300">Live data unavailable: {loadError}</div>
            )}
            </GlassCard>
          </section>

          <section className="gx-interactive-card rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="inst-client-kicker text-emerald-300">Comparison Memorandum</p>
                <h2 className="text-white text-lg font-semibold">Compare Shortlist ({selectedCompareFirms.length}/4)</h2>
                <p className="text-sm text-slate-300 mt-1">Select up to four firms directly from the benchmark board for side-by-side committee review.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCompareFirms.map((firm) => (
                  <button
                    key={firm.slug}
                    type="button"
                    onClick={() => toggleCompare(firm.slug)}
                    className="rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-400/20"
                  >
                    {firm.name} ×
                  </button>
                ))}
                {selectedCompareFirms.length === 0 && (
                  <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-slate-300">No firm selected</span>
                )}
              </div>
            </div>
          </section>

          {/* Rankings Table - Premium glassmorphism design */}
          <section className="gx-interactive-card rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-4 md:p-5">
            <div className="inst-client-section-head !mb-4">
              <p className="inst-client-kicker">Benchmark Ledger</p>
              <h2 className="inst-client-title">Ranked Institutions</h2>
            </div>
            <div className="overflow-x-auto rounded-xl">
          <GlassCard variant="light" className="overflow-hidden p-0 min-w-[1080px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/30 text-slate-300 text-sm font-semibold border-b border-cyan-500/20">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Firm</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-1">Payout</div>
              <div className="col-span-2">Intel</div>
              <div className="col-span-2">Risk</div>
              <div className="col-span-0 md:col-span-0 hidden">Region</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-cyan-500/10">
              {visibleFirms.map((firm, index) => (
                <motion.div
                  key={firm.slug}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.01, 0.25) }}
                >
                  <Link href={`/firms/${firm.slug}`}>
                    <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-800/40
                                  transition-all duration-300 cursor-pointer group
                                  hover:shadow-lg hover:shadow-cyan-500/20">
                      <div className="col-span-1 flex items-center">
                        <ShieldBadge rank={firm.rank} size="sm" />
                      </div>

                      <div className="col-span-4 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={compareSlugs.includes(firm.slug)}
                          onChange={(event) => {
                            event.preventDefault()
                            toggleCompare(firm.slug)
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-cyan-500/40 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                          aria-label={`Select ${firm.name} for comparison`}
                        />
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600
                                      flex items-center justify-center text-white font-bold text-sm mr-3
                                      shadow-lg shadow-cyan-500/30">
                          {firm.name[0]}
                        </div>
                        <div className="min-w-0">
                          <span className="text-white font-semibold group-hover:text-cyan-300 transition-colors block truncate">
                            {firm.name}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {buildWhyRanked(firm).map((reason) => (
                              <span key={reason} className="px-2 py-0.5 rounded-md border border-cyan-500/20 bg-cyan-500/10 text-cyan-100 text-[10px] uppercase tracking-[0.1em]">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="w-full">
                          <ScoreBar score={firm.score} maxScore={100} showValue={true} size="md" />
                        </div>
                      </div>

                      <div className="col-span-1 flex items-center">
                        <div className="w-full">
                          <ScoreBar score={firm.payoutReliability} maxScore={100} showValue={true} size="sm" />
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                            (firm.externalCoverage?.activeSources || 0) > 0
                              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                              : 'border-white/10 bg-white/[0.04] text-slate-400'
                          }`}>
                            {(firm.externalCoverage?.activeSources || 0)}/3 active
                          </span>
                          {(firm.externalCoverage?.sourceNames || []).slice(0, 2).map((source) => (
                            <span key={source} className="px-2 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-[11px] uppercase tracking-[0.14em]">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <RiskBadge risk={firm.risk as 'LOW' | 'MEDIUM' | 'HIGH'} size="sm" />
                      </div>

                      <div className="hidden" aria-hidden="true" />

                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </GlassCard>
            </div>

            {hasMoreRows && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setRowLimit((current) => current + 80)}
                  className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                >
                  Extend Board By 80 Firms ({filteredFirms.length - rowLimit} remaining)
                </button>
              </div>
            )}
          </section>
        </div>
    </div>
  )
}
