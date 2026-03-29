import Link from 'next/link'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { computeFirmSignal, computeBestFor } from '@/lib/signal-engine'
import { detectEarlyWarning, computeSystemicRisk } from '@/lib/risk-engine'
import { SignalBadge, BestForBadge } from '@/components/public/SignalBadge'
import { SystemicRiskBanner } from '@/components/public/SystemicRiskBanner'
import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Best Prop Firms 2026',
  description:
    'Authoritative ranking of the best prop firms in 2026, scored by the GTIXT deterministic five-pillar benchmark: payout reliability, operational stability, regulatory standing, model integrity, and historical consistency.',
  path: '/best-prop-firms',
})

export const dynamic = 'force-dynamic'

function scoreColor(val: number): string {
  if (val >= 75) return '#34d399'
  if (val >= 50) return '#facc15'
  return '#f87171'
}

export default async function BestPropFirmsPage() {
  const { firms, snapshotInfo } = await loadPublicFirmUniverse()
  const systemicRisk = computeSystemicRisk(firms)

  const ranked = firms
    .map((firm) => ({
      name: firm.name || firm.firm_id || 'Unknown firm',
      slug: String(firm.firm_id || firm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      score: Number(firm.score_0_100 || 0),
      payout: Number(firm.payout_reliability || 0),
      stability: Number(firm.operational_stability || 0),
      jurisdiction: firm.jurisdiction || 'Global',
      signal: computeFirmSignal(firm),
      bestFor: computeBestFor(firm),
      earlyWarning: detectEarlyWarning(firm),
    }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  const snapshotDateStr = snapshotInfo.created_at
    ? new Date(snapshotInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen gtixt-bg-premium text-slate-100 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10">
              GTIXT Ranking
            </span>
            {snapshotDateStr && (
              <span className="text-[10px] text-slate-500 font-mono">Updated: {snapshotDateStr}</span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Best Prop Firms
            <span className="block text-2xl md:text-3xl font-semibold text-slate-400 mt-1">Live GTIXT Ranking · {new Date().getFullYear()}</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            This ranking reflects the current GTIXT benchmark universe. Firms are scored across five
            institutional pillars — payout reliability, operational stability, risk model integrity,
            historical consistency, and regulatory standing — and ranked by their composite score.
          </p>
          <SystemicRiskBanner risk={systemicRisk} />
        </header>

        {/* Methodology summary */}
        <section className="rounded-2xl border border-white/8 bg-slate-900/30 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-4">How We Score</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { icon: '💰', title: 'Payout Reliability', desc: 'Execution track record' },
              { icon: '⚙️', title: 'Operational Stability', desc: 'Uptime & rule consistency' },
              { icon: '🔬', title: 'Risk Model Integrity', desc: 'Trading rule soundness' },
              { icon: '📊', title: 'Historical Consistency', desc: 'Multi-cycle score drift' },
              { icon: '🏛️', title: 'Regulatory Standing', desc: 'Jurisdiction & licences' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-[11px] font-semibold text-white leading-tight">{title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking table */}
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-cyan-500/20 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Firm</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-2">Payout</div>
              <div className="col-span-2">Signal</div>
              <div className="col-span-1">Region</div>
            </div>
            {ranked.map((firm, index) => (
              <div
                key={`${firm.slug}-${index}`}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-white/5 text-sm hover:bg-white/[0.02] transition-colors items-start"
              >
                <div className="col-span-1 text-slate-500 text-xs font-mono pt-0.5">{index + 1}</div>
                <div className="col-span-4 font-semibold">
                  <Link href={`/firms/${firm.slug}`} className="text-white hover:text-cyan-300 transition-colors">
                    {firm.name}
                  </Link>
                  {firm.earlyWarning && (
                    <div className="mt-1">
                      <span style={{
                        fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: firm.earlyWarning.severity === 'caution' ? '#fdba74' : '#fde68a',
                        padding: '1px 6px', borderRadius: '4px',
                        background: firm.earlyWarning.severity === 'caution' ? 'rgba(251,146,60,0.12)' : 'rgba(250,204,21,0.10)',
                        border: `1px solid ${firm.earlyWarning.severity === 'caution' ? 'rgba(251,146,60,0.25)' : 'rgba(250,204,21,0.22)'}`,
                      }}>
                        ⚠ {firm.earlyWarning.label}
                      </span>
                    </div>
                  )}
                  {firm.bestFor.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {firm.bestFor.map((tag) => (
                        <BestForBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-sm" style={{ color: scoreColor(firm.score) }}>
                    {firm.score.toFixed(1)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm" style={{ color: scoreColor(firm.payout) }}>
                    {firm.payout.toFixed(1)}
                  </span>
                </div>
                <div className="col-span-2 pt-0.5">
                  <SignalBadge signal={firm.signal} size="sm" showConfidence={true} />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span style={{
                      fontSize: '9px', fontWeight: 700,
                      color: firm.signal.trend === 'up' ? '#34d399' : firm.signal.trend === 'down' ? '#f87171' : firm.signal.trend === 'volatile' ? '#fb923c' : '#64748b',
                    }}>
                      {firm.signal.trend === 'up' ? '↑' : firm.signal.trend === 'down' ? '↓' : firm.signal.trend === 'volatile' ? '⇅' : '→'}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: 600,
                      color: firm.signal.volatility === 'low' ? '#34d399' : firm.signal.volatility === 'high' ? '#f87171' : '#facc15',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      {firm.signal.volatility} vol
                    </span>
                  </div>
                </div>
                <div className="col-span-1 text-slate-400 text-xs truncate pt-0.5">{firm.jurisdiction}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="text-xs text-slate-500 leading-relaxed">
          Score colours: <span className="text-emerald-400 font-medium">Green ≥ 75</span> · <span className="text-yellow-400 font-medium">Yellow 50–74</span> · <span className="text-red-400 font-medium">Red &lt; 50</span>.
          All scores are derived from the current validated snapshot. <Link href="/methodology" className="text-cyan-400 hover:underline">Full methodology</Link>.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/rankings" className="px-5 py-2.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 text-sm font-medium hover:bg-cyan-500/20 transition-colors">
            Open Full Rankings
          </Link>
          <Link href="/analytics" className="px-5 py-2.5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
            Analytics Terminal
          </Link>
        </div>
      </div>
    </div>
  )
}
