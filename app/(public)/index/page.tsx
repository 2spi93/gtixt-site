'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import KPICard from '@/components/public/KPICard'
import RiskBadge from '@/components/public/RiskBadge'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

interface TopFirm {
  rank: number
  slug: string
  name: string
  score: number
  payout: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  jurisdiction: string
}

type RadarEvent = {
  firm_id: string
  firm_name: string
  gri_score: number
  risk_category: string
  warning_signals: string[]
}

type RadarPayload = {
  success: boolean
  headline: string
  count: number
  data: RadarEvent[]
}

type RankingRow = {
  rank: number
  slug: string
  name: string
  score: number
  payoutReliability: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  jurisdiction: string
}

type ResearchPreviewItem = {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
}

export default function IndexPage() {
  const [rows, setRows] = useState<RankingRow[]>([])
  const [radar, setRadar] = useState<RadarPayload | null>(null)
  const [researchItems, setResearchItems] = useState<ResearchPreviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [radarError, setRadarError] = useState<string | null>(null)
  const [researchError, setResearchError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadIndexData = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const response = await fetch('/api/rankings?limit=500', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Rankings API returned ${response.status}`)
        }
        const payload = await response.json()
        const data = Array.isArray(payload?.data) ? payload.data : []

        if (active) {
          setRows(
            data.map((item: Record<string, unknown>) => ({
              rank: Number(item.rank || 0),
              slug: String(item.slug || ''),
              name: String(item.name || 'Unknown'),
              score: Number(item.score || 0),
              payoutReliability: Number(item.payoutReliability || 0),
              risk: item.risk === 'LOW' || item.risk === 'MEDIUM' || item.risk === 'HIGH' ? item.risk : 'MEDIUM',
              jurisdiction: String(item.jurisdiction || 'Global'),
            }))
          )
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load live index data')
          setRows([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadIndexData()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadResearch = async () => {
      try {
        setResearchError(null)
        const response = await fetch('/api/research', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error('Research feed unavailable')
        }

        if (active) {
          const items = Array.isArray(payload?.data) ? payload.data : []
          setResearchItems(
            items.slice(0, 3).map((item: Record<string, unknown>) => ({
              id: String(item.id || item.title || Math.random()),
              title: String(item.title || 'GTIXT Research Note'),
              excerpt: String(item.excerpt || 'GTIXT research publication.'),
              category: String(item.category || 'Research'),
              date: String(item.date || ''),
              readTime: String(item.readTime || ''),
            }))
          )
        }
      } catch (error) {
        if (active) {
          setResearchError(error instanceof Error ? error.message : 'Unable to load research feed')
          setResearchItems([])
        }
      }
    }

    loadResearch()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadRadar = async () => {
      try {
        setRadarError(null)
        const response = await fetch('/api/radar/early-warning?limit=3', { cache: 'no-store' })
        const payload = (await response.json()) as RadarPayload
        if (!response.ok || !payload?.success) {
          throw new Error('Radar feed unavailable')
        }
        if (active) {
          setRadar(payload)
        }
      } catch (error) {
        if (active) {
          setRadarError(error instanceof Error ? error.message : 'Unable to load radar feed')
          setRadar(null)
        }
      }
    }

    loadRadar()
    const interval = setInterval(loadRadar, 30000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const topFirms: TopFirm[] = useMemo(() => {
    return rows.slice(0, 10).map((firm) => ({
      rank: firm.rank,
      slug: firm.slug,
      name: firm.name,
      score: firm.score,
      payout: firm.payoutReliability,
      risk: firm.risk,
      jurisdiction: firm.jurisdiction,
    }))
  }, [rows])

  const distributionData = useMemo(() => {
    if (rows.length === 0) {
      return [
        { name: 'Low Risk', value: 0, color: '#22C55E' },
        { name: 'Medium Risk', value: 0, color: '#F59E0B' },
        { name: 'High Risk', value: 0, color: '#EF4444' },
      ]
    }

    const low = rows.filter((row) => row.risk === 'LOW').length
    const medium = rows.filter((row) => row.risk === 'MEDIUM').length
    const high = rows.filter((row) => row.risk === 'HIGH').length
    const total = rows.length

    return [
      { name: 'Low Risk', value: Math.round((low / total) * 100), color: '#22C55E' },
      { name: 'Medium Risk', value: Math.round((medium / total) * 100), color: '#F59E0B' },
      { name: 'High Risk', value: Math.round((high / total) * 100), color: '#EF4444' },
    ]
  }, [rows])

  const sectorRiskTiers = useMemo(() => {
    const tiers = [
      { tier: 'Tier 1 Premium', count: rows.filter((row) => row.score >= 85).length, color: '#3B82F6' },
      { tier: 'Tier 2 Established', count: rows.filter((row) => row.score >= 75 && row.score < 85).length, color: '#60A5FA' },
      { tier: 'Tier 3 Growth', count: rows.filter((row) => row.score >= 65 && row.score < 75).length, color: '#38BDF8' },
      { tier: 'Tier 4 High Risk', count: rows.filter((row) => row.score < 65).length, color: '#F59E0B' },
    ]
    const total = rows.length || 1
    return tiers.map((item) => ({
      ...item,
      percentage: Math.round((item.count / total) * 100),
    }))
  }, [rows])

  const indexData = useMemo(() => {
    return rows.slice(0, 30).map((row, index) => ({
      date: `#${index + 1}`,
      gtixt: Number(row.score.toFixed(2)),
      risk: row.risk === 'LOW' ? 25 : row.risk === 'MEDIUM' ? 50 : 75,
    }))
  }, [rows])

  const kpi = useMemo(() => {
    if (rows.length === 0) {
      return {
        index: 0,
        risk: 0,
        activeFirms: 0,
        survivalRate: 0,
      }
    }

    const avgScore = rows.reduce((acc, row) => acc + row.score, 0) / rows.length
    const avgRisk = rows.reduce((acc, row) => {
      if (row.risk === 'LOW') return acc + 25
      if (row.risk === 'MEDIUM') return acc + 50
      return acc + 75
    }, 0) / rows.length
    const stableCount = rows.filter((row) => row.risk !== 'HIGH').length

    return {
      index: Number(avgScore.toFixed(1)),
      risk: Number(avgRisk.toFixed(1)),
      activeFirms: rows.length,
      survivalRate: Number(((stableCount / rows.length) * 100).toFixed(1)),
    }
  }, [rows])

  const researchPreview = useMemo(() => {
    if (researchItems.length > 0) return researchItems
    return [
      {
        id: 'fallback-industry-report',
        title: 'GTIXT Research Feed Initializing',
        excerpt: 'The research section is powered by live documents from the GTIXT documentation corpus and refreshes automatically when publication succeeds.',
        category: 'Research',
        date: '',
        readTime: '',
      },
      {
        id: 'fallback-methodology',
        title: 'Methodology and benchmark notes',
        excerpt: 'Core benchmark publications explain the rules-based five-pillar model and how downstream monitoring overlays are derived from the same evidence base.',
        category: 'Methodology',
        date: '',
        readTime: '',
      },
      {
        id: 'fallback-ops',
        title: 'Operational intelligence notes',
        excerpt: 'Radar, analytics, and industry map surfaces convert benchmark publication into monitoring, risk, and concentration views for operators and allocators.',
        category: 'Operations',
        date: '',
        readTime: '',
      },
    ]
  }, [researchItems])

  const heroSignals = useMemo(() => {
    return (radar?.data || []).slice(0, 3)
  }, [radar])

  const leadFirm = topFirms[0] || null

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-[1480px] mx-auto">
        {/* Header - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-[2rem] border border-cyan-500/20 bg-[linear-gradient(180deg,rgba(8,15,28,0.9),rgba(2,6,17,0.98))] p-6 shadow-[0_32px_110px_rgba(2,6,17,0.45)] md:p-8"
        >
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
                <RealIcon name="rankings" size={18} />
                <span className="text-cyan-300 text-sm font-semibold tracking-wide">Institutional Prop Firm Intelligence</span>
              </div>
              <h1 className="mt-6 max-w-5xl text-5xl font-bold leading-[0.95] md:text-7xl">
                <span className="text-white">Benchmark, monitor, and</span>
                <br />
                <GradientText variant="h1">stress-test the prop market</GradientText>
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                GTIXT turns fragmented prop firm data into one decision surface: live rankings, early-warning radar, firm intelligence, and methodology-grade evidence you can actually act on.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/radar" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300">
                  Open Live Radar
                </Link>
                <Link href="/rankings" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]">
                  Review Rankings
                </Link>
                <Link href="/methodology" className="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/15">
                  Inspect Methodology
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Firms Under Coverage</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{loading ? '...' : kpi.activeFirms}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">GTIXT Index</p>
                  <p className="mt-2 text-2xl font-semibold text-cyan-200">{loading ? '...' : kpi.index}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Survival Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">{loading ? '...' : `${kpi.survivalRate}%`}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Refresh Cadence</p>
                  <p className="mt-2 text-2xl font-semibold text-white">30s</p>
                </div>
              </div>
              {loadError && <p className="mt-4 text-sm text-red-300">Live feed unavailable: {loadError}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-[1.7rem] border border-cyan-500/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),rgba(8,15,28,0.42)_38%,rgba(2,6,17,0.96)_100%)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Live Command Surface</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">The market can be scanned in one pass.</h2>
                  </div>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-cyan-100">
                    Live Signals
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[0.92fr_1.08fr]">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Lead Institution</p>
                    <p className="mt-2 text-lg font-semibold text-white">{leadFirm?.name || 'Loading live ranking...'}</p>
                    <p className="mt-1 text-sm text-slate-300">{leadFirm ? `${leadFirm.jurisdiction} · ${leadFirm.risk} risk posture` : 'Awaiting benchmark feed'}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Score</p>
                        <p className="mt-1 text-xl font-semibold text-cyan-200">{leadFirm ? leadFirm.score.toFixed(1) : '...'}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Payout</p>
                        <p className="mt-1 text-xl font-semibold text-white">{leadFirm ? `${leadFirm.payout.toFixed(0)}%` : '...'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Early Warning Highlights</p>
                      <Link href="/radar" className="text-[10px] uppercase tracking-[0.12em] text-cyan-200">Open Radar</Link>
                    </div>
                    <div className="mt-3 space-y-2">
                      {heroSignals.length > 0 ? heroSignals.map((item) => (
                        <div key={item.firm_id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-white">{item.firm_name}</p>
                            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-amber-200">
                              {item.risk_category}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] text-slate-300">{item.warning_signals?.[0] || 'Monitoring signal active'}</p>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-slate-300">
                          {radarError ? radarError : 'Early-warning feed initializing.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Benchmark Layer</p>
                  <p className="mt-2 text-sm font-semibold text-white">Rules-based five-pillar ranking with decision-grade scoring.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Monitoring Layer</p>
                  <p className="mt-2 text-sm font-semibold text-white">Radar and evidence surfaces convert benchmark drift into review priority.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Research Layer</p>
                  <p className="mt-2 text-sm font-semibold text-white">Methodology, briefs, and documentation remain visible and inspectable.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards - Premium glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KPICard
            label="GTIXT Index"
            value={loading ? '...' : kpi.index}
            change={loading ? 'Loading' : 'Live'}
            changeType="neutral"
            iconName="chart"
            gradient={true}
          />
          <KPICard
            label="Risk Index"
            value={loading ? '...' : kpi.risk}
            change={loading ? 'Loading' : 'Live'}
            changeType="neutral"
            iconName="shield"
          />
          <KPICard
            label="Active Firms"
            value={loading ? '...' : kpi.activeFirms}
            change={loading ? 'Loading' : 'Live'}
            changeType="neutral"
            iconName="activity"
          />
          <KPICard
            label="Survival Rate"
            value={loading ? '...' : `${kpi.survivalRate}%`}
            change={loading ? 'Loading' : 'Live'}
            changeType="neutral"
            iconName="trending-up"
          />
        </div>

        {/* Early Warning Widget */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-amber-400/25 p-6 mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div>
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-[0.18em] mb-2">Industry Early Warning</p>
              <h3 className="text-2xl font-semibold text-white mb-1">{radar?.headline || 'Radar feed online'}</h3>
              <p className="text-slate-300 text-sm">Live instability monitor powered by GRI behavioural and operational signals.</p>
            </div>
            <Link href="/radar" className="inline-flex items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/15 transition-colors">
              Open Radar
            </Link>
          </div>

          {radarError && <p className="text-red-300 text-sm">Radar unavailable: {radarError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(radar?.data || []).slice(0, 3).map((item) => (
              <div key={item.firm_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-white font-semibold mb-1">{item.firm_name}</p>
                <p className="text-xs text-slate-400 mb-2">{item.risk_category}</p>
                <p className="text-sm text-amber-200 font-semibold mb-2">GRI {Number(item.gri_score || 0).toFixed(1)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(item.warning_signals || []).slice(0, 2).map((signal) => (
                    <span key={signal} className="text-[11px] rounded-full border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-100">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {(radar?.data || []).length === 0 && !radarError && (
              <div className="md:col-span-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                No active instability alerts in the current window.
              </div>
            )}
          </div>
        </motion.section>

        {/* Risk Signals */}
        <div className="mb-8">
          <p className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.18em] mb-3">Risk Signals</p>
          <h2 className="text-3xl font-semibold mb-2"><span className="title-gradient">Market fragility, resilience, and score dispersion in one view.</span></h2>
          <p className="text-slate-400 max-w-3xl">Use these signals to understand where quality is improving, where concentration risk is rising, and where the market is becoming structurally fragile.</p>
        </div>

        {/* Charts - Premium glassmorphism design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Index Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-6
                     hover:border-cyan-400/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <RealIcon name="rankings" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">GTIXT Index Performance</h3>
                <p className="text-sm text-slate-400">Top-30 score curve (live ranking)</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indexData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00D4C6" />
                    <stop offset="50%" stopColor="#22E6DA" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(11, 28, 43, 0.95)', 
                    border: '1px solid rgba(0, 212, 198, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gtixt" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={3} 
                  dot={false}
                  filter="drop-shadow(0 0 8px rgba(0, 212, 198, 0.5))"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Risk Index Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-6
                     hover:border-green-500/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <RealIcon name="shield" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Risk Index Trend</h3>
                <p className="text-sm text-slate-400">Risk profile by rank (live ranking)</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={indexData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(11, 28, 43, 0.95)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="risk" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRisk)"
                  filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Risk Distribution - Premium design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <RealIcon name="analytics" size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">Risk Distribution</h3>
              <p className="text-sm text-slate-400">Across all tracked firms</p>
            </div>
          </div>
          <div className="space-y-6">
            {distributionData.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="text-white font-bold text-base">{item.value}%</span>
                </div>
                <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{ 
                      backgroundColor: item.color,
                      boxShadow: `0 0 15px ${item.color}60`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                  animate-pulse"></div>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sector Risk Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-8 mt-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <RealIcon name="operations" size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">Sector Risk Map</h3>
              <p className="text-sm text-slate-400">Industry tier distribution</p>
            </div>
          </div>
          <div className="space-y-4">
            {sectorRiskTiers.map((tier, index) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-semibold">{tier.tier}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{tier.count} firms</span>
                    <span className="text-slate-500 text-sm">{tier.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tier.percentage}%` }}
                    transition={{ duration: 1.2, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: tier.color,
                      boxShadow: `0 0 12px ${tier.color}70`
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Firms Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 overflow-hidden mt-8"
        >
          <div className="p-8 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <RealIcon name="rankings" size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Top Firms</h3>
                <p className="text-sm text-slate-400">Preview of the official GTIXT leaderboard</p>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-800/30 border-b border-cyan-500/20 text-slate-400 text-sm font-semibold">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Firm</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Payout</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-1">Country</div>
          </div>

          {/* Table Rows */}
          {topFirms.map((firm, index) => (
            <motion.div
              key={firm.slug || firm.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors group"
            >
              <div className="col-span-1 text-white font-bold text-lg">{firm.rank}</div>
              <div className="col-span-4">
                <Link href={`/firms/${firm.slug}`} className="text-white font-semibold group-hover:text-primary-400 transition-colors">{firm.name}</Link>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{firm.score}</span>
                  <span className="text-primary-400 text-sm">██████</span>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-white font-semibold">{firm.payout}%</span>
              </div>
              <div className="col-span-2">
                <RiskBadge risk={firm.risk} />
              </div>
              <div className="col-span-1">
                <span className="text-slate-400 font-semibold">{firm.jurisdiction}</span>
              </div>
            </motion.div>
          ))}

          <div className="p-6 bg-slate-900/30">
            <Link href="/rankings" className="inline-flex items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/15 transition-colors">
              View Full Rankings
            </Link>
          </div>
        </motion.div>

        {/* Research Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.18em] mb-3">Research</p>
              <h3 className="text-3xl font-semibold"><span className="title-gradient">Briefs and institutional context around the score.</span></h3>
            </div>
            <Link href="/research" className="hidden md:inline-flex items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/15 transition-colors">
              All Research
            </Link>
          </div>

          {researchError && <p className="text-red-300 text-sm mb-4">Research feed unavailable: {researchError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {researchPreview.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + index * 0.05 }}
                className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 p-6"
              >
                <span className="inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200 mb-4">
                  {item.category}
                </span>
                <h4 className="text-xl font-semibold text-white mb-3">{item.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{item.excerpt}</p>
                {(item.date || item.readTime) && (
                  <div className="mt-4 text-xs text-slate-500">
                    {[item.date, item.readTime].filter(Boolean).join(' · ')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.18em] mb-3">Methodology</p>
              <h4 className="text-2xl font-semibold text-white mb-2">Transparent scoring, validated pillars, repeatable framework.</h4>
              <p className="text-slate-400 max-w-2xl">Understand how GTIXT publishes its five-pillar benchmark and how public monitoring layers convert that benchmark into payout, rule-stability, and early-warning views.</p>
            </div>
            <Link href="/methodology" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/35 hover:bg-white/[0.05] transition-colors">
              Read Methodology
            </Link>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
