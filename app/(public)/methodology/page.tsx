'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

const pillars = [
  {
    name: 'Regulatory Compliance',
    weight: '20%',
    icon: 'shield' as RealIconName,
    description: 'Jurisdiction quality, licensing posture, and verifiable oversight signals.',
    metrics: ['Jurisdiction quality', 'Legal entity traceability', 'Regulatory flags', 'Policy disclosures']
  },
  {
    name: 'Operational Excellence',
    weight: '20%',
    icon: 'operations' as RealIconName,
    description: 'Execution stack, operational discipline, rule maintenance, and delivery consistency.',
    metrics: ['Rule-change cadence', 'Operational continuity', 'Support responsiveness', 'Execution quality evidence']
  },
  {
    name: 'Financial Strength',
    weight: '20%',
    icon: 'analytics' as RealIconName,
    description: 'Balance-sheet resilience proxies, payout consistency, and survivability under stress.',
    metrics: ['Payout reliability', 'Capital durability', 'Stress survivability', 'Failure probability inputs']
  },
  {
    name: 'Transparency & Governance',
    weight: '20%',
    icon: 'methodology' as RealIconName,
    description: 'Disclosure quality, governance posture, traceable methodology, and auditability.',
    metrics: ['Evidence traceability', 'Public disclosures', 'Governance clarity', 'Integrity proofs']
  },
  {
    name: 'Market Impact',
    weight: '20%',
    icon: 'research' as RealIconName,
    description: 'Contribution to the ecosystem, market reach, and structural relevance within the prop-firm universe.',
    metrics: ['Coverage breadth', 'Market footprint', 'Ecosystem relevance', 'Cross-market presence']
  }
]

const monitoringLayers = [
  {
    title: 'Published Benchmark Layer',
    description: 'The GTIXT score is produced from the five production pillars above with deterministic rules and immutable snapshot publication.',
  },
  {
    title: 'Monitoring Overlay Layer',
    description: 'Pages such as rankings, radar, analytics, and industry map translate the benchmark into payout reliability, rule stability, early-warning, and topology views.',
  },
]

const operatorMetrics = [
  'Payout Reliability',
  'Rule Stability',
  'Regulatory Score',
  'Firm Longevity',
  'Trader Sentiment',
]

type LatestSnapshot = {
  created_at?: string
  count?: number
  records?: unknown[]
}

type RankingRow = {
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
}

export default function MethodologyPage() {
  const [latest, setLatest] = useState<LatestSnapshot | null>(null)
  const [rows, setRows] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadLiveMetrics = async () => {
      try {
        setLoading(true)
        setLoadError(null)

        const [latestResponse, rankingsResponse] = await Promise.all([
          fetch('/api/index/latest', { cache: 'no-store' }),
          fetch('/api/rankings?limit=500', { cache: 'no-store' }),
        ])

        if (!latestResponse.ok) {
          throw new Error(`Index API returned ${latestResponse.status}`)
        }
        if (!rankingsResponse.ok) {
          throw new Error(`Rankings API returned ${rankingsResponse.status}`)
        }

        const latestPayload = (await latestResponse.json()) as LatestSnapshot
        const rankingsPayload = await rankingsResponse.json()
        const rankingRows = Array.isArray(rankingsPayload?.data)
          ? rankingsPayload.data.map((item: Record<string, unknown>) => ({
              score: Number(item.score || 0),
              risk: item.risk === 'LOW' || item.risk === 'MEDIUM' || item.risk === 'HIGH' ? item.risk : 'MEDIUM',
            }))
          : []

        if (active) {
          setLatest(latestPayload)
          setRows(rankingRows)
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load live methodology metrics')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadLiveMetrics()
    return () => {
      active = false
    }
  }, [])

  const liveStats = useMemo(() => {
    const rowCount = rows.length || latest?.count || (Array.isArray(latest?.records) ? latest.records.length : 0) || 0
    const avgScore = rows.length > 0
      ? rows.reduce((acc, row) => acc + row.score, 0) / rows.length
      : 0
    const lowRiskPct = rows.length > 0
      ? (rows.filter((row) => row.risk === 'LOW').length / rows.length) * 100
      : 0

    return {
      rowCount,
      avgScore: Number(avgScore.toFixed(1)),
      lowRiskPct: Number(lowRiskPct.toFixed(1)),
      updatedDate: latest?.created_at ? new Date(latest.created_at).toISOString().slice(0, 10) : 'N/A',
    }
  }, [latest, rows])

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inst-client-section-head"
        >
          <p className="inst-client-kicker">Institutional-Grade Framework</p>
          <h1 className="inst-client-title">
            <GradientText variant="h1">GTIXT Methodology</GradientText>
          </h1>
          <p className="inst-client-subtitle max-w-3xl">
            A transparent, rules-based benchmark for prop trading firms.
            Five production pillars, deterministic publication controls, and live monitoring overlays built from the same source of truth.
          </p>
          {loadError && <p className="text-red-300 text-sm mt-4">Live feed unavailable: {loadError}</p>}
        </motion.div>

        {/* Scoring Formula */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-md border border-cyan-500/30 p-8"
        >
          <div className="inst-client-section-head !mb-5">
            <p className="inst-client-kicker">Scoring Engine</p>
            <h2 className="inst-client-title">Formula & Weights</h2>
          </div>
          <div className="bg-slate-950/80 rounded-lg p-6 font-mono text-sm text-slate-200 overflow-x-auto border border-cyan-500/20">
            <div className="text-cyan-300 mb-4">GTIXT_Score = (</div>
            <div className="ml-8 space-y-1">
              <div>0.20 × Regulatory_Compliance +</div>
              <div>0.20 × Operational_Excellence +</div>
              <div>0.20 × Financial_Strength +</div>
              <div>0.20 × Transparency_Governance +</div>
              <div>0.20 × Market_Impact</div>
            </div>
            <div className="text-cyan-300 mt-4">) × 100</div>
          </div>
          <p className="text-slate-400 text-sm mt-4">
            Final score ranges from 0 to 100. Scores above 80 indicate institutional-grade quality under the published GTIXT benchmark model.
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {loading ? 'Loading live benchmark...' : `Current live average score: ${liveStats.avgScore} across ${liveStats.rowCount} firms.`}
          </p>
        </motion.section>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {monitoringLayers.map((layer, index) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + index * 0.08 }}
                className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-6"
              >
                <p className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.18em] mb-3">GTIXT Layer</p>
                <h3 className="text-xl font-semibold text-white mb-3">{layer.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{layer.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Five Pillars */}
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-5 md:p-6">
          <div className="inst-client-section-head !mb-6">
            <p className="inst-client-kicker">Method Components</p>
            <h2 className="inst-client-title"><GradientText variant="h2">Five Benchmark Pillars</GradientText></h2>
            <p className="inst-client-subtitle !max-w-4xl mt-2">
              Public dashboards also expose five operator metrics for faster monitoring. These metrics are derived views of the same benchmark evidence,
              not a separate scoring model.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {operatorMetrics.map((metric) => (
                <span
                  key={metric}
                  className="px-3 py-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 text-cyan-200 text-xs font-medium"
                >
                  {metric}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 hover:border-cyan-400/50 transition-all card-glow backdrop-blur-md"
              >
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <RealIcon name={pillar.icon} size={30} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-semibold text-white">{pillar.name}</h3>
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-sm font-semibold border border-cyan-500/30">
                        {pillar.weight}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-6">{pillar.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pillar.metrics.map((metric) => (
                        <div
                          key={metric}
                          className="flex items-center gap-2 text-sm text-slate-400"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Governance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
        >
          <div className="inst-client-section-head !mb-5">
            <p className="inst-client-kicker">Governance</p>
            <h2 className="inst-client-title">Data Publication Controls</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-cyan-300 mb-2">{loading ? '...' : liveStats.updatedDate}</div>
              <div className="text-slate-300 text-sm">Latest published snapshot date</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-300 mb-2">{loading ? '...' : liveStats.rowCount}</div>
              <div className="text-slate-300 text-sm">Covered firms in the live ranking layer</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-300 mb-2">{loading ? '...' : `${liveStats.lowRiskPct}%`}</div>
              <div className="text-slate-300 text-sm">Low-risk share from current live ranking data</div>
            </div>
          </div>
        </motion.section>
      </div>
      </div>
    </div>
  )
}
