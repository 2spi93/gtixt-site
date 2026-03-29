'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'
import type { HistorySources } from '@/components/public/FirmHistoryLayer'

const FirmHistoryLayer = dynamic(() => import('@/components/public/FirmHistoryLayer'), {
  loading: () => (
    <div className="rounded-2xl bg-slate-900/40 border border-white/10 p-6 text-slate-300">
      Loading historical intelligence layer...
    </div>
  ),
})

const FirmPillarRadar = dynamic(() => import('@/components/public/FirmPillarRadar'), {
  loading: () => (
    <div className="h-[320px] rounded-xl bg-slate-900/40 border border-white/10 animate-pulse" />
  ),
})

type FirmProfile = {
  slug: string
  firm_id: string | null
  name: string
  website: string | null
  jurisdiction: string | null
  jurisdiction_tier?: string | null
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  status: string | null
  founded: number | null
  payoutFrequency: string | null
  maxAccountSizeUsd: number | null
  pillars: {
    payoutReliability: number
    riskModelIntegrity: number
    operationalStability: number
    historicalConsistency: number
  }
}

type ApiPayload = {
  success: boolean
  data?: FirmProfile
  error?: string
}

type IntelligenceData = {
  gtixt_score: number
  risk_index: number
  risk_category: string
  regulatory_status: 'Verified' | 'Unknown' | 'Suspicious'
  rvi_status: string
  rvi_score: number
  payout_reliability: number
  operational_stability: number
  early_warning: boolean
}

type IntelligencePayload = {
  success: boolean
  data?: IntelligenceData
  error?: string
}

type HistoryPayload = {
  success: boolean
  sources?: HistorySources
  error?: string
}

function normalizeRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 80) return 'LOW'
  if (score >= 65) return 'MEDIUM'
  return 'HIGH'
}

function formatUsd(value: number | null): string {
  if (!value || Number.isNaN(value)) return 'N/A'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value.toFixed(0)}`
}

function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed).toString()
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString()
    } catch {
      return null
    }
  }
}

export default function FirmProfilePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ''

  const [profile, setProfile] = useState<FirmProfile | null>(null)
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null)
  const [historySources, setHistorySources] = useState<HistorySources | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        setLoadError(null)

        const [response, intelligenceResponse, historyResponse] = await Promise.all([
          fetch(`/api/firms/${slug}`, { cache: 'no-store' }),
          fetch(`/api/intelligence/firm/${slug}`, { cache: 'no-store' }),
          fetch(`/api/firms/${slug}/history-layer`, { cache: 'no-store' }),
        ])

        const payload = (await response.json()) as ApiPayload

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || `Profile API returned ${response.status}`)
        }

        let intelligencePayload: IntelligencePayload | null = null
        let historyPayload: HistoryPayload | null = null
        try {
          intelligencePayload = (await intelligenceResponse.json()) as IntelligencePayload
        } catch {
          intelligencePayload = null
        }

        try {
          historyPayload = (await historyResponse.json()) as HistoryPayload
        } catch {
          historyPayload = null
        }

        if (active) {
          setProfile({
            ...payload.data,
            risk: payload.data.risk || normalizeRisk(Number(payload.data.score || 0)),
          })
          setIntelligence(intelligencePayload?.success ? intelligencePayload.data || null : null)
          setHistorySources(historyPayload?.success ? historyPayload.sources || null : null)
          setHistoryError(historyResponse.ok ? null : historyPayload?.error || 'Historical intelligence layer unavailable')
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load firm profile')
          setProfile(null)
          setIntelligence(null)
          setHistorySources(null)
          setHistoryError(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [slug])

  const radarData = useMemo(() => {
    if (!profile) return []
    return [
      { metric: 'Payout Reliability', value: Number(profile.pillars.payoutReliability || 0) },
      { metric: 'Risk Model', value: Number(profile.pillars.riskModelIntegrity || 0) },
      { metric: 'Operational Stability', value: Number(profile.pillars.operationalStability || 0) },
      { metric: 'Historical Consistency', value: Number(profile.pillars.historicalConsistency || 0) },
    ]
  }, [profile])

  const websiteUrl = useMemo(() => {
    if (!profile?.website) return null
    return normalizeWebsiteUrl(profile.website)
  }, [profile])

  const historyCoverage = useMemo(() => {
    const sourceNames: Array<'similarweb' | 'wayback' | 'trustpilot'> = ['similarweb', 'wayback', 'trustpilot']
    const statusBySource = sourceNames.map((source) => {
      const metricGroups = historySources?.[source]
      const metricCount = metricGroups ? Object.keys(metricGroups).length : 0
      return {
        source,
        active: metricCount > 0,
      }
    })

    return {
      activeSources: statusBySource.filter((item) => item.active).length,
      statusBySource,
    }
  }, [historySources])

  const committeeBrief = useMemo(() => {
    if (!profile) return null

    const score = Number(profile.score || 0)
    const risk = intelligence?.risk_category || profile.risk
    const posture = intelligence?.early_warning
      ? 'Heightened committee review'
      : score >= 80
        ? 'Standard institutional monitoring'
        : score >= 65
          ? 'Reinforced diligence posture'
          : 'Priority diligence posture'

    const summary = intelligence?.early_warning
      ? `${profile.name} is currently operating under an elevated monitoring posture with early warning conditions visible in the GTIXT intelligence layer.`
      : score >= 80
        ? `${profile.name} currently screens as a comparatively stable monitored institution with no immediate escalation flag in the latest intelligence layer.`
        : `${profile.name} warrants reinforced review due to benchmark softness, risk posture, or incomplete corroboration across the available evidence layer.`

    return {
      posture,
      risk,
      summary,
    }
  }, [intelligence, profile])

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-[1480px]">
          <Link href="/firms" className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8">
            <span aria-hidden>←</span> Back to firms
          </Link>

          {loading && (
            <div className="rounded-2xl bg-slate-900/40 border border-cyan-500/20 p-8 text-slate-300">Loading firm profile...</div>
          )}

          {!loading && loadError && (
            <div className="rounded-2xl bg-red-950/30 border border-red-400/30 p-8">
              <h1 className="text-2xl font-semibold text-white mb-2">Firm profile unavailable</h1>
              <p className="text-red-200 text-sm">{loadError}</p>
            </div>
          )}

          {!loading && profile && (
            <>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="rounded-[1.75rem] border border-cyan-500/25 bg-slate-900/40 p-7 backdrop-blur-xl shadow-[0_28px_90px_rgba(2,6,23,0.32)]">
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
                        <RealIcon name="firms" size={18} />
                        <span className="text-cyan-300 text-sm font-semibold tracking-wide">Investment Committee Profile</span>
                      </div>
                      <h1 className="mt-5 text-5xl font-bold"><GradientText variant="h1">{profile.name}</GradientText></h1>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">{committeeBrief?.summary}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-300">
                          External Coverage
                          <strong className="text-white font-semibold">{historyCoverage.activeSources}/3</strong>
                        </span>
                        {historyCoverage.statusBySource.map((item) => (
                          <span
                            key={item.source}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs uppercase tracking-[0.18em] ${
                              item.active
                                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                                : 'border-white/10 bg-white/[0.04] text-slate-400'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-emerald-300' : 'bg-slate-500'}`} />
                            {item.source}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Committee Posture</p>
                          <p className="mt-2 text-sm font-semibold text-white">{committeeBrief?.posture}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Risk Classification</p>
                          <p className="mt-2 text-sm font-semibold text-white">{committeeBrief?.risk}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Jurisdiction</p>
                          <p className="mt-2 text-sm font-semibold text-white">{profile.jurisdiction || 'N/A'}{profile.jurisdiction_tier ? ` · ${profile.jurisdiction_tier}` : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] p-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Committee Snapshot</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3">
                          <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Benchmark Score</p>
                          <p className="mt-1 text-2xl font-semibold text-cyan-200">{profile.score.toFixed(1)}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3">
                          <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Coverage Layer</p>
                          <p className="mt-1 text-2xl font-semibold text-emerald-200">{historyCoverage.activeSources}/3</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3">
                          <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Status</p>
                          <p className="mt-1 text-sm font-semibold text-white">{profile.status || 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3">
                          <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Founded</p>
                          <p className="mt-1 text-sm font-semibold text-white">{profile.founded || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {websiteUrl && (
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="gx-pressable rounded-xl border border-white/20 px-5 py-2.5 text-white transition-all hover:border-cyan-400/50 hover:bg-white/5"
                          >
                            Official Website
                          </a>
                        )}
                        <Link href="/rankings" className="gx-pressable rounded-xl bg-blue-500 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-400">
                          Compare in Rankings
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><span className="text-slate-400">Payout Frequency:</span> <span className="font-semibold text-white">{profile.payoutFrequency || 'N/A'}</span></div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><span className="text-slate-400">Max Account Size:</span> <span className="font-semibold text-white">{formatUsd(profile.maxAccountSizeUsd)}</span></div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><span className="text-slate-400">Risk Level:</span> <span className="font-semibold text-white">{profile.risk}</span></div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><span className="text-slate-400">Firm ID:</span> <span className="font-semibold text-white">{profile.firm_id || 'N/A'}</span></div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {intelligence && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="gx-interactive-card xl:col-span-2 rounded-2xl bg-slate-900/45 border border-amber-400/25 p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h2 className="text-white text-xl font-semibold">Committee Intelligence Memorandum</h2>
                      {intelligence.early_warning && (
                        <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-lg border border-amber-300/40 bg-amber-500/15 text-amber-200">
                          Early Warning
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                      <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                        <p className="text-slate-400">GTIXT Score</p>
                        <p className="text-white font-semibold text-lg">{intelligence.gtixt_score.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                        <p className="text-slate-400">Risk Index</p>
                        <p className="text-amber-200 font-semibold text-lg">{intelligence.risk_index.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                        <p className="text-slate-400">Regulatory Status</p>
                        <p className="text-white font-semibold text-lg">{intelligence.regulatory_status}</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                        <p className="text-slate-400">Payout Reliability</p>
                        <p className="text-white font-semibold text-lg">{intelligence.payout_reliability.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                        <p className="text-slate-400">Operational Stability</p>
                        <p className="text-white font-semibold text-lg">{intelligence.operational_stability.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-300 flex flex-wrap gap-x-6 gap-y-1">
                      <span>Risk Category: <strong className="text-white">{intelligence.risk_category}</strong></span>
                      <span>RVI: <strong className="text-white">{intelligence.rvi_status}</strong> ({intelligence.rvi_score.toFixed(0)})</span>
                      <span>
                        External Layer: <strong className="text-white">{historyCoverage.activeSources > 0 ? `${historyCoverage.activeSources} source${historyCoverage.activeSources > 1 ? 's' : ''} active` : 'Awaiting coverage'}</strong>
                      </span>
                    </div>
                  </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="xl:col-span-2">
                  <FirmHistoryLayer sources={historySources} error={historyError} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gx-interactive-card rounded-2xl bg-slate-900/40 border border-white/10 p-6 backdrop-blur-xl">
                  <h2 className="text-white text-xl font-semibold mb-4">Pillar Radar</h2>
                  <FirmPillarRadar data={radarData} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="gx-interactive-card rounded-2xl bg-slate-900/40 border border-white/10 p-6 backdrop-blur-xl">
                  <h2 className="text-white text-xl font-semibold mb-4">Operating Ledger</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                      <span className="text-slate-300">Payout Frequency</span>
                      <span className="text-white font-semibold">{profile.payoutFrequency || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                      <span className="text-slate-300">Max Account Size</span>
                      <span className="text-white font-semibold">{formatUsd(profile.maxAccountSizeUsd)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                      <span className="text-slate-300">Payout Reliability</span>
                      <span className="text-white font-semibold">{profile.pillars.payoutReliability > 0 ? profile.pillars.payoutReliability.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                      <span className="text-slate-300">Risk Model Integrity</span>
                      <span className="text-white font-semibold">{profile.pillars.riskModelIntegrity > 0 ? profile.pillars.riskModelIntegrity.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                      <span className="text-slate-300">Operational Stability</span>
                      <span className="text-white font-semibold">{profile.pillars.operationalStability > 0 ? profile.pillars.operationalStability.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                      <span className="text-slate-300">Historical Consistency</span>
                      <span className="text-white font-semibold">{profile.pillars.historicalConsistency > 0 ? profile.pillars.historicalConsistency.toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
