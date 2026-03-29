'use client'

import Link from 'next/link'
import GTIXTSymbol from '@/components/design-system/GTIXTSymbol'
import { trackEvent } from '@/lib/plausible'

// Stat pills: live truths that scan in one pass
const STATS = [
  { value: '138', label: 'Firms Tracked', tone: 'nominal' },
  { value: '5', label: 'Institutional Pillars', tone: 'nominal' },
  { value: '72%', label: 'High Risk · Downtrend', tone: 'high' },
  { value: 'SHA-256', label: 'Audit Fingerprint', tone: 'elevated' },
]

export default function Hero() {
  return (
    <section className="gx-hero relative flex min-h-[92vh] items-center justify-center overflow-hidden">
      {/* Background: deep black + turquoise radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#050c14]" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(0,212,198,0.13)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,198,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,198,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">

        {/* System badge — recognisable instantly */}
        <div className="gx-system-badge mb-10 inline-flex items-center gap-2.5 rounded-full border border-[#00D4C6]/25 bg-[#00D4C6]/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#00D4C6] gx-fade-in">
          <span className="gx-symbol-wrap h-6 w-6">
            <GTIXTSymbol size={14} animated />
          </span>
          <span className="gx-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[#00D4C6]" />
          Global Prop Trading Index · Updated March 2026
        </div>

        {/* THE impact block — comprehension in 3 lines */}
        <div className="mb-8">
          <p className="mb-3 text-lg font-semibold tracking-tight text-slate-400 md:text-xl">
            No standard.&nbsp; No audit.&nbsp; No trust.
          </p>
          <h1 className="gx-wordmark text-[clamp(4rem,10vw,8rem)] font-bold leading-none tracking-[-0.04em] text-white">
            GTIXT
          </h1>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-400 md:text-xl">
            fixes&nbsp;that.
          </p>
        </div>

        {/* Single-sentence mission — never skip */}
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
          The first deterministic, auditable benchmark for the global prop trading industry.&nbsp;
          Five institutional pillars. Verified scores. Zero marketing.
        </p>

        {/* CTA zone — ONE primary, ONE secondary */}
        <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/rankings"
            onClick={() => trackEvent('hero_cta_click', { cta: 'hero_rankings', surface: 'hero' })}
            className="gx-cta-primary gx-pressable inline-flex items-center gap-2 rounded-lg bg-[#00D4C6] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#050c14] transition-all hover:bg-[#22E6DA] hover:shadow-[0_0_28px_rgba(0,212,198,0.45)]"
          >
            View Rankings
          </Link>
          <Link
            href="/methodology"
            onClick={() => trackEvent('hero_cta_click', { cta: 'hero_methodology', surface: 'hero' })}
            className="gx-pressable inline-flex items-center gap-2 rounded-lg border border-white/20 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-200 transition-all hover:border-white/40 hover:text-white"
          >
            Read the Methodology
          </Link>
        </div>

        {/* Signal bar — fast facts, scans in 1 second */}
        <div className="gx-signal-bar mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-3 rounded-xl border border-white/[0.09] bg-white/[0.03] px-6 py-4">
          {STATS.map(({ value, label, tone }) => (
            <div
              key={label}
              className={`gx-signal-badge gx-signal-shimmer gx-interactive-card ${
                tone === 'high' ? 'gx-signal-badge--high' : tone === 'elevated' ? 'gx-signal-badge--elevated' : 'gx-signal-badge--nominal'
              }`}
            >
              <span className="text-sm font-extrabold tracking-[0.02em]">{value}</span>
              <span className="text-[10px] tracking-[0.12em]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <div className="h-7 w-[22px] rounded-full border border-white/30 flex justify-center pt-1.5">
          <div className="h-2.5 w-0.5 animate-bounce rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  )
}
