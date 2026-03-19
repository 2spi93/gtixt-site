import Link from 'next/link'
import type { MarketInsight } from '@/lib/market-insights'

const TONE = {
  emerald: {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    kicker: 'text-emerald-400',
  },
  amber: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    kicker: 'text-amber-400',
  },
  red: {
    border: 'border-red-500/20',
    bg: 'bg-red-500/5',
    kicker: 'text-red-400',
  },
  cyan: {
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    kicker: 'text-cyan-400',
  },
}

export default function MarketInsightsPanel({ insights }: { insights: MarketInsight[] }) {
  if (!insights.length) return null

  return (
    <section className="px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="inst-client-section-head">
          <p className="inst-client-kicker">GTIXT Insights</p>
          <h2 className="inst-client-title">Auto-generated market intelligence</h2>
          <p className="inst-client-subtitle">
            Deterministic narratives synthesized from the current validated universe.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {insights.map((insight) => {
            const tone = TONE[insight.tone]
            return (
              <Link
                key={`${insight.kicker}-${insight.title}`}
                href={insight.href}
                className={`group rounded-2xl border ${tone.border} ${tone.bg} px-6 py-6 transition-all hover:bg-white/[0.04]`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.kicker} mb-2`}>
                  {insight.kicker}
                </p>
                <h3 className="text-lg font-bold text-white leading-snug mb-2">{insight.title}</h3>
                <p className="text-sm text-dark-400 leading-relaxed mb-4">{insight.summary}</p>
                <span className={`text-xs font-semibold ${tone.kicker} group-hover:underline`}>
                  Open intelligence view →
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
