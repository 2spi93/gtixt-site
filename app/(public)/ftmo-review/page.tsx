import Link from 'next/link'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { computeFirmSignal, computeBestFor } from '@/lib/signal-engine'
import { detectEarlyWarning } from '@/lib/risk-engine'
import { SignalBadge } from '@/components/public/SignalBadge'
import { SignalInsight } from '@/components/public/SignalInsight'

export const metadata = {
  title: 'FTMO Review 2026 — GTIXT Intelligence',
  description:
    'Independent FTMO review with live GTIXT score, payout reliability breakdown, regulatory standing, and analyst risk assessment.',
}

export const dynamic = 'force-dynamic'

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function scoreColor(val: number): string {
  if (val >= 75) return '#34d399'   // green
  if (val >= 50) return '#facc15'   // yellow
  return '#f87171'                   // red
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = scoreColor(value)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default async function FtmoReviewPage() {
  const { firms, snapshotInfo } = await loadPublicFirmUniverse()
  const ftmo = firms.find((firm) => normalize(firm.name || firm.firm_id || '') === 'ftmo')

  const score = Number(ftmo?.score_0_100 || 0)
  const payout = Number(ftmo?.payout_reliability || 0)
  const op = Number(ftmo?.operational_stability || 0)
  const riskModel = Number(ftmo?.risk_model_integrity || 0)
  const historicalConsistency = Number(ftmo?.historical_consistency || 0)
  const signal = ftmo ? computeFirmSignal(ftmo) : null
  const bestFor = ftmo ? computeBestFor(ftmo) : []
  const earlyWarning = ftmo ? detectEarlyWarning(ftmo) : null
  const snapshotDateStr = snapshotInfo.created_at
    ? new Date(snapshotInfo.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'latest snapshot'

  const scoreQualifier =
    score >= 75 ? { label: 'Strong', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/30' }
    : score >= 55 ? { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-400/30' }
    : { label: 'Weak', color: 'text-red-400', bg: 'bg-red-500/10 border-red-400/30' }

  const notFound = !ftmo

  return (
    <main className="min-h-screen gtixt-bg-premium text-slate-100 px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10">
              GTIXT Review
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Data: {snapshotDateStr}</span>
            {signal && <SignalBadge signal={signal} size="sm" />}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            FTMO
            <span className="block text-2xl md:text-3xl font-semibold text-slate-400 mt-1">
              Independent Intelligence Review
            </span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            FTMO is one of the most established proprietary trading firms globally, known for its structured
            evaluation model, European regulatory context, and published track record. This review maps FTMO
            against the GTIXT five-pillar framework: payout reliability, operational stability, risk model
            integrity, historical consistency, and regulatory standing.
          </p>
          {notFound && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/8 px-4 py-3 text-amber-300 text-sm">
              FTMO was not found in the current snapshot universe. Scores below are unavailable.
            </div>
          )}
        </header>

        {/* Composite Score Hero */}
        {!notFound && (
          <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="text-center md:text-left flex-shrink-0">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">GTIXT Composite Score</p>
              <div className={`inline-block rounded-2xl border px-6 py-4 ${scoreQualifier.bg}`}>
                <span className={`text-5xl font-black ${scoreQualifier.color}`}>{score.toFixed(1)}</span>
                <span className="text-slate-400 text-sm ml-2">/ 100</span>
              </div>
              <p className={`mt-2 text-sm font-semibold ${scoreQualifier.color}`}>{scoreQualifier.label} posture</p>
            </div>
            <div className="flex-1 w-full space-y-4">
              <ScoreBar label="Payout Reliability" value={payout} />
              <ScoreBar label="Operational Stability" value={op} />
              <ScoreBar label="Risk Model Integrity" value={riskModel} />
              <ScoreBar label="Historical Consistency" value={historicalConsistency} />
            </div>
          </section>
        )}

        {/* Methodology trust signal */}
        <section className="rounded-2xl border border-white/8 bg-slate-900/30 p-6 space-y-3">
          <h2 className="text-base font-semibold text-cyan-400 uppercase tracking-wider">Why trust this score?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
            {[
              ['Deterministic', 'Scores are computed automatically from evidence-backed data, not editorial opinion.'],
              ['Auditable', 'Every score change is logged and timestamped in the GTIXT audit trail.'],
              ['Multi-source', 'Data is cross-referenced from regulatory filings, trader forums, and crawled firm data.'],
              ['Versioned', 'Each snapshot carries a SHA-256 fingerprint for reproducibility.'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="font-semibold text-white mb-0.5">{title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Analyst note */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/35 p-6 space-y-3 text-sm text-slate-300">
          <h2 className="text-xl font-semibold text-white">Analyst Note</h2>
          <p>
            FTMO maintains a strong brand recognition and structured challenge process, making it a
            reference point for the industry. However, institutional operators should weigh composite
            score trends — particularly payout execution and rule-stability signals — before allocation
            or partnership decisions.
          </p>
          <p>
            This page reflects the latest validated GTIXT snapshot. For real-time signal context and
            drill-down evidence layers, use the full firm profile and analytics terminal.
          </p>
        </section>

        {/* GTIXT Signal Intelligence */}
        {signal && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-4">GTIXT Signal Intelligence</h2>
            <SignalInsight signal={signal} bestFor={bestFor} earlyWarning={earlyWarning} />
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/firms/ftmo"
            className="px-5 py-2.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Open FTMO Full Profile
          </Link>
          <Link
            href="/analytics"
            className="px-5 py-2.5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            Open Analytics Terminal
          </Link>
          <Link
            href="/rankings"
            className="px-5 py-2.5 rounded-lg border border-white/15 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Compare with Rankings
          </Link>
        </div>
      </div>
    </main>
  )
}
