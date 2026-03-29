import Link from 'next/link'
import MarketInsightsPanel from '@/components/public/MarketInsightsPanel'
import { SystemicRiskBanner } from '@/components/public/SystemicRiskBanner'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { buildMarketInsightsReport } from '@/lib/market-insights'
import { computeSystemicRisk } from '@/lib/risk-engine'
import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Insights 2026 Market Intelligence Feed',
  description:
    'Auto-generated GTIXT market intelligence: systemic stress, rising firms, early warnings, and risk-watch narratives from the validated public universe.',
  path: '/insights',
})

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  const { firms, snapshotInfo } = await loadPublicFirmUniverse()
  const systemicRisk = computeSystemicRisk(firms)
  const report = buildMarketInsightsReport(firms)
  const snapshotDateStr = snapshotInfo.created_at
    ? new Date(snapshotInfo.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'latest snapshot'

  return (
    <div className="min-h-screen gtixt-bg-premium text-slate-100 px-6 py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10">
              GTIXT Insights Feed
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Snapshot: {snapshotDateStr}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Market Intelligence
            <span className="block text-2xl md:text-3xl font-semibold text-slate-400 mt-1">
              Deterministic narratives for a non-standardized market
            </span>
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl leading-relaxed">
            This feed converts the current validated GTIXT universe into systemic narratives: market stress,
            rising strength, early deterioration, and immediate operator review zones.
          </p>
          <SystemicRiskBanner risk={systemicRisk} />
        </header>

        <MarketInsightsPanel insights={report.insights} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400 mb-3">Rising Firms</p>
            <div className="space-y-3">
              {report.rising.length > 0 ? report.rising.map((firm) => (
                <Link key={firm.slug} href={`/firms/${firm.slug}`} className="block rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-colors">
                  <p className="text-white font-semibold">{firm.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Composite score: {firm.score.toFixed(1)}</p>
                </Link>
              )) : <p className="text-sm text-slate-400">No rising firms in the current slice.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400 mb-3">Early Warnings</p>
            <div className="space-y-3">
              {report.warnings.length > 0 ? report.warnings.map((firm) => (
                <Link key={firm.slug} href={`/firms/${firm.slug}`} className="block rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-colors">
                  <p className="text-white font-semibold">{firm.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{firm.label} · {firm.severity}</p>
                </Link>
              )) : <p className="text-sm text-slate-400">No early warnings in the current slice.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400 mb-3">Risk Watch</p>
            <div className="space-y-3">
              {report.stressed.length > 0 ? report.stressed.map((firm) => (
                <Link key={firm.slug} href={`/firms/${firm.slug}`} className="block rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-colors">
                  <p className="text-white font-semibold">{firm.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{firm.signalLabel}</p>
                </Link>
              )) : <p className="text-sm text-slate-400">No stressed firms in the current slice.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-3">API Access</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            The same deterministic feed is exposed programmatically for downstream terminals, dashboards, and evidence layers.
          </p>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 font-mono text-xs text-cyan-300">
            GET /api/insights
          </div>
        </section>
      </div>
    </div>
  )
}
