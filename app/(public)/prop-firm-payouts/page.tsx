import Link from 'next/link'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { computeFirmSignal } from '@/lib/signal-engine'
import { SignalBadge } from '@/components/public/SignalBadge'

export const metadata = {
  title: 'Prop Firm Payouts Comparison 2026 — GTIXT',
  description:
    'Live comparison of prop firm payout reliability, execution consistency, and payout frequency — ranked from the current GTIXT validated snapshot.',
}

export const dynamic = 'force-dynamic'

function payoutColor(val: number): string {
  if (val >= 75) return '#34d399'
  if (val >= 50) return '#facc15'
  return '#f87171'
}

function freqBadge(freq: string): { label: string; cls: string } {
  const f = freq.toLowerCase()
  if (f.includes('week')) return { label: 'Weekly', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20' }
  if (f.includes('bi')) return { label: 'Bi-weekly', cls: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/20' }
  if (f.includes('month')) return { label: 'Monthly', cls: 'text-yellow-300 bg-yellow-500/10 border-yellow-400/20' }
  return { label: freq, cls: 'text-slate-400 bg-white/5 border-white/10' }
}

export default async function PropFirmPayoutsPage() {
  const { firms, snapshotInfo } = await loadPublicFirmUniverse()

  const payoutLeaders = firms
    .map((firm) => ({
      name: firm.name || firm.firm_id || 'Unknown firm',
      slug: String(firm.firm_id || firm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      payout: Number(firm.payout_reliability || 0),
      score: Number(firm.score_0_100 || 0),
      stability: Number(firm.operational_stability || 0),
      frequency: firm.payout_frequency || 'N/A',
      signal: computeFirmSignal(firm),
    }))
    .filter((f) => f.payout > 0)
    .sort((a, b) => b.payout - a.payout)
    .slice(0, 20)

  const snapshotDateStr = snapshotInfo.created_at
    ? new Date(snapshotInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null

  const universeAvgPayout = payoutLeaders.length
    ? Math.round((payoutLeaders.reduce((s, f) => s + f.payout, 0) / payoutLeaders.length) * 10) / 10
    : null

  return (
    <main className="min-h-screen gtixt-bg-premium text-slate-100 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10">
              GTIXT Payout Intelligence
            </span>
            {snapshotDateStr && (
              <span className="text-[10px] text-slate-500 font-mono">Updated: {snapshotDateStr}</span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Prop Firm Payouts
            <span className="block text-2xl md:text-3xl font-semibold text-slate-400 mt-1">Reliability Comparison · {new Date().getFullYear()}</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            Payout reliability is one of the most critical signals for operator decision-making.
            GTIXT scores each firm on its actual execution track record across multiple snapshot cycles —
            not self-reported claims. The table below ranks the top payout performers in the current universe.
          </p>
        </header>

        {/* Universe context strip */}
        {universeAvgPayout !== null && (
          <div className="flex gap-4 flex-wrap">
            <div className="rounded-xl border border-white/8 bg-slate-900/40 px-5 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Universe Avg. Payout</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: payoutColor(universeAvgPayout) }}>
                {universeAvgPayout.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-slate-900/40 px-5 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Firms Ranked</p>
              <p className="text-2xl font-bold text-white mt-0.5">{payoutLeaders.length}</p>
            </div>
          </div>
        )}

        {/* Payout methodology primer */}
        <section className="rounded-2xl border border-white/8 bg-slate-900/30 p-5 text-sm text-slate-300">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-3">What is Payout Reliability?</h2>
          <p className="leading-relaxed">
            GTIXT&rsquo;s payout reliability score aggregates evidence from trader-reported payment outcomes,
            historical data crawls, and snapshot-to-snapshot consistency analysis. A score of 75+ indicates
            consistent, on-time payouts with minimal disputes documented. Scores below 50 signal elevated
            execution risk or insufficient evidence for certification.
          </p>
        </section>

        {/* Ranking table */}
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-cyan-500/20 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Firm</div>
              <div className="col-span-2">Payout Score</div>
              <div className="col-span-2">Signal</div>
              <div className="col-span-3">Frequency</div>
            </div>
            {payoutLeaders.map((firm, index) => {
              const badge = freqBadge(firm.frequency)
              return (
                <div
                  key={`${firm.slug}-${index}`}
                  className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-white/5 text-sm hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-1 text-slate-500 text-xs font-mono">{index + 1}</div>
                  <div className="col-span-4 font-semibold">
                    <Link href={`/firms/${firm.slug}`} className="text-white hover:text-cyan-300 transition-colors">
                      {firm.name}
                    </Link>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold" style={{ color: payoutColor(firm.payout) }}>
                      {firm.payout.toFixed(1)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <SignalBadge signal={firm.signal} size="sm" />
                  </div>
                  <div className="col-span-3">
                    {firm.frequency !== 'N/A' ? (
                      <span className={`text-[10px] font-medium rounded-full border px-2 py-0.5 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="text-xs text-slate-500 leading-relaxed">
          Payout scores: <span className="text-emerald-400 font-medium">Green ≥ 75</span> · <span className="text-yellow-400 font-medium">Yellow 50–74</span> · <span className="text-red-400 font-medium">Red &lt; 50</span>.
          Data is derived from the current GTIXT validated snapshot. <Link href="/methodology" className="text-cyan-400 hover:underline">Full methodology</Link>.
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
    </main>
  )
}
