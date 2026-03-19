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

  return (
    <main className="min-h-screen bg-dark-950">
      <Hero />

      {/* Systemic Risk Banner — cross-firm market intelligence */}
      <div className="px-6 pt-5">
        <div className="max-w-7xl mx-auto">
          <SystemicRiskBanner risk={systemicRisk} />
        </div>
      </div>

      {/* Mission statement — institutional editorial block */}
      <section className="px-6 pt-16 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-primary-500/15 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent backdrop-blur-sm px-8 py-10 md:px-14 md:py-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-400 mb-3">Global Prop Trading Index</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-snug mb-4 max-w-3xl">
              A deterministic, auditable benchmark of the global prop trading industry.
            </h2>
            <p className="text-dark-300 text-base md:text-lg leading-relaxed max-w-3xl">
              GTIXT tracks every major proprietary trading firm across five institutional pillars — payout
              reliability, operational stability, regulatory standing, model integrity, and trader sentiment —
              and synthesises them into a single, transparent composite score. No marketing, no bias: only
              signal.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-dark-400">
              <Link href="/methodology" className="flex items-center gap-1.5 hover:text-primary-400 transition-colors">
                <RealIcon name="methodology" size={14} />
                Read the methodology whitepaper
              </Link>
              <Link href="/rankings" className="flex items-center gap-1.5 hover:text-primary-400 transition-colors">
                <RealIcon name="analytics" size={14} />
                View full rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Context — why GTIXT exists */}
      <section className="px-6 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400 mb-2">The Problem</p>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">500+ firms. Zero accountability layer.</h3>
              <p className="text-sm text-dark-400 leading-relaxed">
                New firms launch overnight, rules change silently, and operators fail without warning.
                There is no universal standard — traders have no reliable signal to navigate this market.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400 mb-2">The Reality</p>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">Opacity is the default. Scams are common.</h3>
              <p className="text-sm text-dark-400 leading-relaxed">
                Payout failures, abrupt rule revisions, and ghost firms are endemic. Reviews are bought.
                Leaderboards are sponsored. Traders are left with noise, not intelligence.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-400 mb-2">The Answer</p>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">GTIXT is the reference layer.</h3>
              <p className="text-sm text-dark-400 leading-relaxed">
                Five deterministic pillars. Snapshot versioning. Auditable scores with SHA-256 fingerprints.
                GTIXT instruments the industry so operators can make decisions on signal — not hope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Dashboard — live data from snapshot */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="inst-client-section-head">
            <p className="inst-client-kicker">Executive Snapshot</p>
            <h2 className="inst-client-title">Market Integrity Overview</h2>
            <p className="inst-client-subtitle">
              Live indicators derived from the current validated snapshot.{' '}
              <span className="text-dark-500 text-xs font-normal">{kpiSubtitle}</span>
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

      {/* Action CTAs — "What do I do now?" intelligence layer */}
      <section className="px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inst-client-section-head">
            <p className="inst-client-kicker">Operator Intelligence</p>
            <h2 className="inst-client-title">What do I do with this data?</h2>
            <p className="inst-client-subtitle">
              GTIXT translates raw scores into operator decisions. Pick your scenario.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <Link href="/best-prop-firms" className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all px-6 py-7 block">
              <div className="text-2xl mb-3">🛡️</div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400 mb-1">Conservative Operator</p>
              <h3 className="text-base font-bold text-white mb-2">I want stability &amp; consistency first.</h3>
              <p className="text-sm text-dark-400 leading-relaxed mb-4">
                Filter firms by operational stability ≥ 70 and historical consistency ≥ 65.
                GTIXT surfaces only firms that have maintained performance across multiple snapshot cycles.
              </p>
              <span className="text-xs font-semibold text-emerald-400 group-hover:underline">View stable firms →</span>
            </Link>
            <Link href="/prop-firm-payouts" className="group rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all px-6 py-7 block">
              <div className="text-2xl mb-3">⚡</div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400 mb-1">Payout Focused</p>
              <h3 className="text-base font-bold text-white mb-2">I need fast, reliable payouts.</h3>
              <p className="text-sm text-dark-400 leading-relaxed mb-4">
                GTIXT payout intelligence ranks firms by verified execution track record.
                Weekly and bi-weekly operators are flagged and scored on consistency — not promises.
              </p>
              <span className="text-xs font-semibold text-cyan-400 group-hover:underline">Compare payout leaders →</span>
            </Link>
            <Link href="/best-prop-firms" className="group rounded-2xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all px-6 py-7 block">
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

          <div className="relative group rounded-3xl overflow-hidden
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
                    className="group/btn relative px-8 py-4 rounded-xl
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
    </main>
  )
}
