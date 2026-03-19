'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import GlassCapsule from '@/components/public/GlassCapsule'
import Link from 'next/link'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

type LatestSnapshot = {
  sha256?: string
  created_at?: string
  records?: unknown[]
  count?: number
}

type RankingRow = {
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
}

type DatasetCard = {
  name: string
  size: string
  records: number
  format: string[]
  updated: string
  iconName: 'database' | 'trending-up' | 'chart' | 'clock'
  variant: 'primary' | 'secondary' | 'success' | 'info'
  href: string
}

const apiEndpoints = [
  { method: 'GET', path: '/api/index/latest', description: 'Get latest GTIXT index snapshot' },
  { method: 'GET', path: '/api/firms', description: 'List all firms with scores' },
  { method: 'GET', path: '/api/firms/:slug', description: 'Get detailed firm data' },
  { method: 'GET', path: '/api/rankings', description: 'Get ranked firms with filters' },
  { method: 'GET', path: '/api/snapshot/latest', description: 'Get cached latest raw snapshot payload' },
  { method: 'GET', path: '/api/data/exports/:dataset', description: 'Download GTIXT exports as attachment-ready JSON or CSV' },
]

export default function DataPage() {
  const [latest, setLatest] = useState<LatestSnapshot | null>(null)
  const [rows, setRows] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadLiveData = async () => {
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
          ? rankingsPayload.data.map((item: any) => ({
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
          setLoadError(error instanceof Error ? error.message : 'Unable to load live data metadata')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadLiveData()
    return () => {
      active = false
    }
  }, [])

  const datasets = useMemo<DatasetCard[]>(() => {
    const recordCount = latest?.count || (Array.isArray(latest?.records) ? latest.records.length : 0) || rows.length
    const updated = latest?.created_at ? new Date(latest.created_at).toISOString().slice(0, 10) : 'N/A'
    const snapshotSizeMb = latest ? `${(JSON.stringify(latest).length / (1024 * 1024)).toFixed(2)} MB` : 'N/A'
    const lowRiskCount = rows.filter((row) => row.risk === 'LOW').length

    return [
      {
        name: 'Full Index Snapshot',
        size: snapshotSizeMb,
        records: recordCount,
        format: ['JSON'],
        updated,
        iconName: 'database' as const,
        variant: 'primary' as const,
        href: '/api/data/exports/full-index-snapshot?format=json',
      },
      {
        name: 'Rankings Feed',
        size: `${rows.length} rows`,
        records: rows.length,
        format: ['CSV', 'JSON'],
        updated,
        iconName: 'trending-up' as const,
        variant: 'success' as const,
        href: '/api/data/exports/rankings-feed?format=csv',
      },
      {
        name: 'Risk Distribution',
        size: `${lowRiskCount} low-risk`,
        records: rows.length,
        format: ['CSV', 'JSON'],
        updated,
        iconName: 'chart' as const,
        variant: 'secondary' as const,
        href: '/api/data/exports/risk-distribution?format=json',
      },
      {
        name: 'Integrity Metadata',
        size: latest?.sha256 ? 'SHA-256' : 'N/A',
        records: latest?.sha256 ? 1 : 0,
        format: ['CSV', 'JSON'],
        updated,
        iconName: 'clock' as const,
        variant: 'info' as const,
        href: '/api/data/exports/integrity-metadata?format=json',
      },
    ]
  }, [latest, rows])

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header - Enhanced with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inst-client-section-head"
        >
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/20 backdrop-blur-sm mb-4">
            <RealIcon name="api" size={30} />
          </div>
          <p className="inst-client-kicker">Data Access Layer</p>
          <h1 className="inst-client-title mb-2">
            <span className="text-white">Explore Index </span>
            <GradientText variant="h1">Data & Downloads</GradientText>
          </h1>
          <p className="inst-client-subtitle max-w-3xl">
            Institutional-grade transparency, downloadable snapshots, and audit-ready metrics.
            Every dataset below is wired to a live public export route with attachment-ready JSON or CSV output.
          </p>
          {loadError && <p className="text-red-300 text-sm mt-4">Live feed unavailable: {loadError}</p>}
        </motion.div>

        {/* Download Capsules - Premium glassmorphism design */}
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-5 md:p-6">
          <div className="inst-client-section-head !mb-5">
            <p className="inst-client-kicker">Output</p>
            <h2 className="inst-client-title">Available Datasets</h2>
          </div>
          <div className="flex items-center justify-between mb-8">
            <p className="text-slate-300 font-semibold">Curated datasets ready for institutional analysis</p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full 
                          bg-white/[0.03] border border-cyan-500/20 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>{loading ? 'Loading live data...' : 'Live data'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {datasets.map((dataset, index) => (
              <motion.div
                key={dataset.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCapsule
                  iconName={dataset.iconName}
                  title={dataset.name}
                  subtitle={`${dataset.records.toLocaleString()} records • ${dataset.size} • ${dataset.format.join(', ')} • Updated ${dataset.updated}`}
                  variant={dataset.variant}
                  href={dataset.href}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 rounded-2xl bg-slate-900/40 border border-cyan-500/20 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <RealIcon name="analytics" size={18} className="mt-1" />
                <div>
                  <div className="text-white font-semibold mb-1">Updated Daily</div>
                  <div className="text-sm text-slate-400">
                    {latest?.created_at ? `Latest published snapshot: ${new Date(latest.created_at).toISOString()}` : 'Snapshot timestamp unavailable'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RealIcon name="shield" size={18} className="mt-1" />
                <div>
                  <div className="text-white font-semibold mb-1">SHA-256 Verified</div>
                  <div className="text-sm text-slate-400">
                    <Link href="/verify" className="text-primary-400 hover:text-primary-300">
                      Verify snapshots
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* API Preview - Enhanced glassmorphism */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-8"
        >
          <div className="inst-client-section-head !mb-5">
            <p className="inst-client-kicker">Integration</p>
            <h2 className="inst-client-title">API Endpoint Preview</h2>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <RealIcon name="api" size={22} />
            </div>
            <div>
              <p className="text-slate-200 font-semibold">API Endpoints</p>
              <p className="text-slate-400 text-sm">RESTful API for programmatic access and public export downloads</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {apiEndpoints.map((endpoint, index) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] 
                         hover:border-primary-500/30 hover:bg-white/[0.04] 
                         transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-2">
                  <span className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 
                               text-green-400 text-xs font-bold uppercase tracking-wider">
                    {endpoint.method}
                  </span>
                  <code className="text-primary-400 font-mono text-sm group-hover:text-primary-300 transition-colors">
                    {endpoint.path}
                  </code>
                </div>
                <div className="text-slate-400 text-sm pl-[72px]">{endpoint.description}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/[0.05]">
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl 
                       bg-gradient-to-r from-primary-500 to-primary-800 text-white 
                       font-semibold hover:shadow-[0_0_30px_rgba(0,212,198,0.3)] 
                       transition-all duration-300"
            >
              <RealIcon name="api" size={18} />
              View Full API Documentation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.section>
      </div>
      </div>
    </div>
  )
}
