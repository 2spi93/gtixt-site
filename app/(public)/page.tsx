import Hero from '@/components/public/Hero'
import IndexOverview from '@/components/public/IndexOverview'
import TopFirms from '@/components/public/TopFirms'
import SectorRisk from '@/components/public/SectorRisk'
import MethodologyPreview from '@/components/public/MethodologyPreview'
import ResearchArticles from '@/components/public/ResearchArticles'
import KPICard from '@/components/public/KPICard'
import MarketInsightsPanel from '@/components/public/MarketInsightsPanel'
import Link from 'next/link'
import { RealIcon } from '@/components/design-system/RealIcon'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { generateMarketInsights, type MarketInsight } from '@/lib/market-insights'
import { computeSystemicRisk } from '@/lib/risk-engine'
import { SystemicRiskBanner } from '@/components/public/SystemicRiskBanner'
import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Global Prop Trading Index',
  description:
    'GTIXT is the institutional benchmark for prop firm transparency, payout reliability, and deterministic risk intelligence.',
  path: '/',
})

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Live snapshot — falls back gracefully if pipeline is down
  let firmCount = 0
  let avgScore: number | null = null
  let avgPayout: number | null = null
  let avgStability: number | null = null
  let snapshotVersion = ''
  let snapshotDate = ''
  let systemicRisk = computeSystemicRisk([])
  let marketInsights: MarketInsight[] = []

  try {
    const { firms, snapshotInfo } = await loadPublicFirmUniverse()
    firmCount = firms.length
    const scored = firms.filter((f) => (f.score_0_100 ?? 0) > 0)
    avgScore = scored.length
      ? Math.round((scored.reduce((s, f) => s + (f.score_0_100 ?? 0), 0) / scored.length) * 10) / 10
      : null
    const withPayout = firms.filter((f) => (f.payout_reliability ?? 0) > 0)
    avgPayout = withPayout.length
      ? Math.round((withPayout.reduce((s, f) => s + (f.payout_reliability ?? 0), 0) / withPayout.length) * 10) / 10
      : null
    const withStab = firms.filter((f) => (f.operational_stability ?? 0) > 0)
    avgStability = withStab.length
      ? Math.round((withStab.reduce((s, f) => s + (f.operational_stability ?? 0), 0) / withStab.length) * 10) / 10
      : null
    if (snapshotInfo.created_at) {
      const d = new Date(snapshotInfo.created_at)
      snapshotDate = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    // Extract version tag from object path e.g. universe_v0.1_public/...
    const match = snapshotInfo.object?.match(/universe_(v[\d.]+)/)
    snapshotVersion = match?.[1] ?? ''
    systemicRisk = computeSystemicRisk(firms)
    marketInsights = generateMarketInsights(firms)
  } catch {
    // fail open — KPI cards will show N/A
  }

  const kpiSubtitle = snapshotDate
    ? `Latest snapshot${snapshotVersion ? ` · ${snapshotVersion}` : ''} · ${snapshotDate}`
    : 'Snapshot data syncing…'
  const stressRatioPct = systemicRisk.totalTracked > 0
    ? Math.round(systemicRisk.stressRatio * 100)
    : null

  return (
    <div className="min-h-screen bg-[#050c14]">
      <Hero />

      <section className="px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/45 backdrop-blur-xl p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="gx-section-kicker">Trust Layer</p>
                <h2 className="text-xl font-bold text-white">Validation Snapshot</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Live benchmark context for fast operator decisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/rankings" className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20 transition-colors">
                  Open Rankings
                </Link>
                <Link href="/methodology" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors">
                  Verify Methodology
                </Link>
                <Link href="/simulator" className="rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-400/20 transition-colors">
                  Run Simulator
                </Link>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Last Update</p>
                <p className="text-sm font-semibold text-white mt-1">{snapshotDate || 'Pending'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Tracked Universe</p>
                <p className="text-sm font-semibold text-white mt-1">{firmCount > 0 ? `${firmCount} firms` : 'Pending'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Stress Ratio</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {stressRatioPct !== null ? `${stressRatioPct}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Snapshot Fingerprint</p>
                <p className="text-sm font-semibold text-white mt-1">{snapshotVersion || 'sha-256 published'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ZONE SIGNAL: fast-scan context ── */}
      <section className="gx-zone-signal px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <SystemicRiskBanner risk={systemicRisk} />

          {/* 3-card market context — scan in 10 seconds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="gx-card gx-interactive-card rounded-2xl px-6 py-5 border-red-500/20 bg-red-500/[0.04]">
              <p className="gx-section-kicker text-red-400 mb-1">The Problem</p>
              <h3 className="text-base font-bold text-white mb-1.5">500+ firms. Zero accountability.</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Firms launch overnight, rules change silently, payouts fail. No universal standard exists.
              </p>
            </div>
            <div className="gx-card gx-interactive-card rounded-2xl px-6 py-5 border-amber-500/20 bg-amber-500/[0.04]">
              <p className="gx-section-kicker text-amber-400 mb-1">The Reality</p>
              <h3 className="text-base font-bold text-white mb-1.5">Opacity is the default.</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Reviews are bought. Leaderboards are sponsored. Traders operate on noise — not signal.
              </p>
            </div>
            <div className="gx-card-teal gx-card gx-interactive-card rounded-2xl px-6 py-5">
              <p className="gx-section-kicker mb-1">The Answer</p>
              <h3 className="text-base font-bold text-white mb-1.5">GTIXT is the first public risk model.</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Five deterministic pillars. SHA-256 score fingerprints. Signal — not hope.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* ── ZONE DATA: live snapshot indicators ── */}
      <section className="gx-zone-data px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <p className="gx-section-kicker">Executive Snapshot</p>
            <h2 className="gx-section-title">Market Integrity Overview</h2>
            <p className="gx-section-sub">
              Live indicators from the current validated snapshot.{' '}
              <span className="text-slate-600 text-xs">{kpiSubtitle}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              label="GTIXT Index"
              value={avgScore !== null ? avgScore.toString() : 'N/A'}
              change={avgScore !== null ? `Avg. composite score` : 'Snapshot syncing'}
              changeType={avgScore !== null ? 'positive' : 'neutral'}
              iconName="trending-up"
              gradient={true}
            />
            <KPICard
              label="Firms Tracked"
              value={firmCount > 0 ? firmCount.toString() : 'N/A'}
              change={firmCount > 0 ? `Latest snapshot` : 'Snapshot syncing'}
              changeType={firmCount > 0 ? 'positive' : 'neutral'}
              iconName="building"
            />
            <KPICard
              label="Avg. Payout Reliability"
              value={avgPayout !== null ? avgPayout.toString() : 'N/A'}
              change="Universe median"
              changeType={avgPayout !== null ? (avgPayout >= 60 ? 'positive' : 'negative') : 'neutral'}
              iconName="alert"
            />
            <KPICard
              label="Avg. Operational Stability"
              value={avgStability !== null ? avgStability.toString() : 'N/A'}
              change="Universe median"
              changeType={avgStability !== null ? (avgStability >= 60 ? 'positive' : 'negative') : 'neutral'}
              iconName="target"
            />
          </div>
        </div>
      </section>

      <IndexOverview />
      <TopFirms />

      {/* ── ZONE EXPLAIN: operator use-cases ── */}
      <section className="gx-zone-explain px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <p className="gx-section-kicker">Operator Intelligence</p>
            <h2 className="gx-section-title">What do I do with this data?</h2>
            <p className="gx-section-sub">
              Pick your scenario. GTIXT translates scores into decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <Link href="/best-prop-firms" className="group gx-interactive-card gx-pressable rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all px-6 py-7 block">
              <div className="text-2xl mb-3">🛡️</div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400 mb-1">Conservative Operator</p>
              <h3 className="text-base font-bold text-white mb-2">I want stability &amp; consistency first.</h3>
              <p className="text-sm text-dark-400 leading-relaxed mb-4">
                Filter firms by operational stability ≥ 70 and historical consistency ≥ 65.
                GTIXT surfaces only firms that have maintained performance across multiple snapshot cycles.
              </p>
              <span className="text-xs font-semibold text-emerald-400 group-hover:underline">View stable firms →</span>
            </Link>
            <Link href="/prop-firm-payouts" className="group gx-interactive-card gx-pressable rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all px-6 py-7 block">
              <div className="text-2xl mb-3">⚡</div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400 mb-1">Payout Focused</p>
              <h3 className="text-base font-bold text-white mb-2">I need fast, reliable payouts.</h3>
              <p className="text-sm text-dark-400 leading-relaxed mb-4">
                GTIXT payout intelligence ranks firms by verified execution track record.
                Weekly and bi-weekly operators are flagged and scored on consistency — not promises.
              </p>
              <span className="text-xs font-semibold text-cyan-400 group-hover:underline">Compare payout leaders →</span>
            </Link>
            <Link href="/best-prop-firms" className="group gx-interactive-card gx-pressable rounded-2xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all px-6 py-7 block">
              <div className="text-2xl mb-3">🏦</div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400 mb-1">High Capital Scaling</p>
              <h3 className="text-base font-bold text-white mb-2">I'm scaling &amp; need large funded accounts.</h3>
              <p className="text-sm text-dark-400 leading-relaxed mb-4">
                Filter by account size ≥ $200K with composite score ≥ 65.
                GTIXT tracks which high-capital operators maintain institutional-grade structural integrity.
              </p>
              <span className="text-xs font-semibold text-violet-400 group-hover:underline">Find high-capital firms →</span>
            </Link>
          </div>
        </div>
      </section>

      <MarketInsightsPanel insights={marketInsights} />

      {/* Industry Map — ecosystem explorer section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="inst-client-section-head">
            <p className="inst-client-kicker">Ecosystem Intelligence</p>
            <h2 className="inst-client-title">Explore the Prop Firm Galaxy</h2>
            <p className="inst-client-subtitle">
              The Industry Map renders structural links between prop firms, brokers, liquidity providers, and
              regulators in a three-dimensional interactive globe. Select any node to see its GTIXT score,
              risk signal, and jurisdictional context.
            </p>
          </div>

          <div className="relative group gx-interactive-card rounded-3xl overflow-hidden
                          bg-gradient-to-br from-primary-500/5 via-primary-800/5 to-transparent
                          backdrop-blur-xl border border-primary-500/20
                          hover:border-primary-500/40 transition-all duration-500">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,212,198,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_50%)]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                          bg-gradient-to-r from-transparent via-primary-500/5 to-transparent" />

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                                bg-primary-500/10 border border-primary-500/30 text-primary-400
                                text-xs font-bold uppercase tracking-wider mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                    </span>
                    Live · Interactive
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                    Industry Map
                    <span className="block bg-gradient-to-r from-primary-400 via-primary-500 to-primary-800
                                   bg-clip-text text-transparent">
                      Interactive Globe
                    </span>
                  </h3>

                  <p className="text-base text-dark-300 max-w-xl leading-relaxed mb-4">
                    Navigate the complete prop trading ecosystem in 3D. Node colour reflects risk signal;
                    arc width reflects relationship strength. Cinematic camera locks onto selected firms
                    for drill-down context.
                  </p>

                  <div className="grid grid-cols-2 gap-3 max-w-xs text-sm">
                    {[['Firms & Brokers', 'primary-500'],['Liquidity Providers', 'primary-800'],['Regulators', 'cyan-400'],['Risk Signals', 'red-400']].map(([label, color]) => (
                      <div key={label} className="flex items-center gap-2 text-dark-400">
                        <div className={`w-2.5 h-2.5 rounded-full bg-${color}`} />
                        <span className="text-xs">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <Link
                    href="/industry-map"
                    className="group/btn gx-pressable relative px-8 py-4 rounded-xl
                             bg-gradient-to-r from-primary-500 to-primary-800
                             text-white font-bold text-lg
                             hover:shadow-[0_0_40px_rgba(0,212,198,0.4)]
                             transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <RealIcon name="galaxy" size={18} />
                      Open Industry Map
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full
                                  transition-transform duration-1000
                                  bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </Link>
                  <p className="text-xs text-dark-500 text-center md:text-right max-w-[16rem]">
                    Requires a modern browser with WebGL support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectorRisk />
      <MethodologyPreview />
      <ResearchArticles />
    </div>
  )
}
