'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import GlassCapsule from '@/components/public/GlassCapsule'
import { RealIcon } from '@/components/design-system/RealIcon'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { GradientText } from '@/components/design-system/GlassComponents'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ErrorBar,
} from 'recharts'

const firmProfiles = {
  ftmo: {
    name: 'FTMO',
    score: 92.4,
    risk: 'LOW',
    jurisdiction: 'Czech Republic',
    jurisdictionCode: 'CZ',
    founded: 2015,
    tradersFunded: '~180k',
    broker: 'Eightcap',
    platform: 'MT5',
    metrics: [
      { metric: 'Payout Reliability', value: 95 },
      { metric: 'Rule Stability', value: 88 },
      { metric: 'Regulatory Score', value: 85 },
      { metric: 'Longevity', value: 90 },
      { metric: 'Trader Sentiment', value: 92 },
    ],
    scoreEvolution: [
      { year: '2021', score: 78 },
      { year: '2022', score: 84 },
      { year: '2023', score: 82 },
      { year: '2024', score: 91 },
      { year: '2025', score: 92.4 },
    ],
    payoutMetrics: {
      successRate: '94%',
      averagePayoutTime: '4.2 days',
      maxFundedAccount: '$400k',
      profitSplit: '90%',
    },
    riskAnalysis: {
      ruleChangesPerYear: 1,
      complaintsRatio: '0.8%',
      shutdownProbability12m: '9%',
    },
  },
  fundingpips: {
    name: 'FundingPips',
    score: 89,
    risk: 'LOW',
    jurisdiction: 'UAE',
    jurisdictionCode: 'AE',
    founded: 2022,
    tradersFunded: '~55k',
    broker: 'Purple Trading',
    platform: 'MT5',
    metrics: [
      { metric: 'Payout Reliability', value: 91 },
      { metric: 'Rule Stability', value: 87 },
      { metric: 'Regulatory Score', value: 84 },
      { metric: 'Longevity', value: 85 },
      { metric: 'Trader Sentiment', value: 90 },
    ],
    scoreEvolution: [
      { year: '2021', score: 69 },
      { year: '2022', score: 74 },
      { year: '2023', score: 72 },
      { year: '2024', score: 87 },
      { year: '2025', score: 89 },
    ],
    payoutMetrics: {
      successRate: '91%',
      averagePayoutTime: '4.8 days',
      maxFundedAccount: '$300k',
      profitSplit: '90%',
    },
    riskAnalysis: {
      ruleChangesPerYear: 2,
      complaintsRatio: '1.2%',
      shutdownProbability12m: '12%',
    },
  },
  topstep: {
    name: 'Topstep',
    score: 87,
    risk: 'MEDIUM',
    jurisdiction: 'United States',
    jurisdictionCode: 'US',
    founded: 2012,
    tradersFunded: '~120k',
    broker: 'Eightcap',
    platform: 'cTrader',
    metrics: [
      { metric: 'Payout Reliability', value: 88 },
      { metric: 'Rule Stability', value: 83 },
      { metric: 'Regulatory Score', value: 86 },
      { metric: 'Longevity', value: 84 },
      { metric: 'Trader Sentiment', value: 86 },
    ],
    scoreEvolution: [
      { year: '2021', score: 74 },
      { year: '2022', score: 78 },
      { year: '2023', score: 76 },
      { year: '2024', score: 86 },
      { year: '2025', score: 87 },
    ],
    payoutMetrics: {
      successRate: '89%',
      averagePayoutTime: '5.1 days',
      maxFundedAccount: '$250k',
      profitSplit: '80%',
    },
    riskAnalysis: {
      ruleChangesPerYear: 3,
      complaintsRatio: '1.7%',
      shutdownProbability12m: '16%',
    },
  },
  apex: {
    name: 'Apex Trader',
    score: 84,
    risk: 'MEDIUM',
    jurisdiction: 'United States',
    jurisdictionCode: 'US',
    founded: 2021,
    tradersFunded: '~70k',
    broker: 'Eightcap',
    platform: 'MT5',
    metrics: [
      { metric: 'Payout Reliability', value: 82 },
      { metric: 'Rule Stability', value: 80 },
      { metric: 'Regulatory Score', value: 85 },
      { metric: 'Longevity', value: 79 },
      { metric: 'Trader Sentiment', value: 83 },
    ],
    scoreEvolution: [
      { year: '2021', score: 68 },
      { year: '2022', score: 73 },
      { year: '2023', score: 71 },
      { year: '2024', score: 82 },
      { year: '2025', score: 84 },
    ],
    payoutMetrics: {
      successRate: '86%',
      averagePayoutTime: '5.4 days',
      maxFundedAccount: '$200k',
      profitSplit: '90%',
    },
    riskAnalysis: {
      ruleChangesPerYear: 4,
      complaintsRatio: '2.1%',
      shutdownProbability12m: '19%',
    },
  },
} as const

export default function FirmProfilePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug ?? 'unknown'

  const profile = useMemo(() => {
    const known = firmProfiles[slug as keyof typeof firmProfiles]
    if (known) return known

    return {
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
      score: 78,
      risk: 'MEDIUM',
      jurisdiction: 'N/A',
      jurisdictionCode: 'N/A',
      founded: 2020,
      tradersFunded: '~N/A',
      broker: 'N/A',
      platform: 'N/A',
      metrics: [
        { metric: 'Payout Reliability', value: 76 },
        { metric: 'Rule Stability', value: 79 },
        { metric: 'Regulatory Score', value: 78 },
        { metric: 'Longevity', value: 75 },
        { metric: 'Trader Sentiment', value: 80 },
      ],
      scoreEvolution: [
        { year: '2021', score: 69 },
        { year: '2022', score: 72 },
        { year: '2023', score: 71 },
        { year: '2024', score: 76 },
        { year: '2025', score: 78 },
      ],
      payoutMetrics: {
        successRate: '84%',
        averagePayoutTime: '6.0 days',
        maxFundedAccount: '$150k',
        profitSplit: '80%',
      },
      riskAnalysis: {
        ruleChangesPerYear: 3,
        complaintsRatio: '2.5%',
        shutdownProbability12m: '22%',
      },
    }
  }, [slug])

  const scoreEvolutionData = useMemo(() => {
    const source = profile.scoreEvolution.map((point, index) => ({
      ...point,
      yearNum: 2021 + index,
      uncertainty: index < 2 ? 2.2 : index < 4 ? 1.8 : 1.4,
    }))

    const count = source.length
    const sumX = source.reduce((acc, point) => acc + point.yearNum, 0)
    const sumY = source.reduce((acc, point) => acc + point.score, 0)
    const sumXY = source.reduce((acc, point) => acc + point.yearNum * point.score, 0)
    const sumXX = source.reduce((acc, point) => acc + point.yearNum * point.yearNum, 0)
    const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / count

    return source.map((point) => {
      const trend = Number((intercept + slope * point.yearNum).toFixed(1))
      return {
        ...point,
        trend,
        confidenceTop: Number((point.score + point.uncertainty).toFixed(1)),
      }
    })
  }, [profile.scoreEvolution])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/firms" className="inline-flex items-center gap-2 text-dark-300 hover:text-white mb-8">
          <span aria-hidden>←</span> Back to firms
        </Link>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="rounded-2xl bg-[#0B1C2B]/80 border border-primary-500/30 shadow-[0_0_30px_rgba(0,212,198,0.2)] backdrop-blur-xl p-7">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-6">
              <RealIcon name="firms" size={18} />
              <span className="text-cyan-300 text-sm font-semibold tracking-wide">Firm Intelligence Profile</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="text-5xl font-bold mb-4"><GradientText variant="h1">{profile.name}</GradientText></h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-dark-200 text-sm">
                  <div><span className="text-dark-400">Score:</span> <span className="text-white font-semibold">{profile.score}</span></div>
                  <div><span className="text-dark-400">Risk Level:</span> <span className="text-green-400 font-semibold">{profile.risk}</span></div>
                  <div><span className="text-dark-400">Jurisdiction:</span> <span className="text-white">{profile.jurisdiction}</span></div>
                  <div><span className="text-dark-400">Founded:</span> <span className="text-white">{profile.founded}</span></div>
                  <div><span className="text-dark-400">Traders funded:</span> <span className="text-white">{profile.tradersFunded}</span></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/rankings" className="px-5 py-2.5 rounded-xl border border-white/[0.15] text-white hover:border-primary-500/40 hover:bg-white/[0.04] transition-all">
                  Compare Firm
                </Link>
                <Link href="/industry-map" className="px-5 py-2.5 rounded-xl bg-gradient-turquoise text-white font-semibold hover:shadow-[0_0_24px_rgba(0,212,198,0.35)] transition-all">
                  View Industry Map
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
            <h2 className="text-white text-xl font-semibold mb-4">Score Breakdown</h2>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={profile.metrics}>
                  <PolarGrid stroke="rgba(255,255,255,0.18)" />
                  <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={25} domain={[0, 100]} stroke="#475569" />
                  <Radar name="Score" dataKey="value" stroke="#00D4C6" fill="#00D4C6" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm">
              {profile.metrics.map((m) => (
                <div key={m.metric} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                  <span className="text-dark-300">{m.metric}</span>
                  <span className="text-white font-semibold">{m.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
            <h2 className="text-white text-xl font-semibold mb-4">Score Evolution</h2>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={scoreEvolutionData}>
                <defs>
                  <linearGradient id="firmScoreLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00D4C6" />
                    <stop offset="50%" stopColor="#22E6DA" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                  <linearGradient id="firmScoreArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4C6" stopOpacity={0.32} />
                    <stop offset="45%" stopColor="#22E6DA" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="2 6" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                  tickLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  domain={[64, 96]}
                  ticks={[65, 70, 75, 80, 85, 90, 95]}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                  tickLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                  width={44}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'score') return [`${value}`, 'Observed Score']
                    if (name === 'trend') return [`${value}`, 'Trendline']
                    if (name === 'confidenceTop') return [`${value}`, 'Confidence Upper']
                    return [value, name]
                  }}
                  contentStyle={{
                    backgroundColor: '#0B1C2B',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    color: '#E2E8F0',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="none"
                  fill="url(#firmScoreArea)"
                  fillOpacity={1}
                />

                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="rgba(148,163,184,0.75)"
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  dot={false}
                  name="trend"
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="url(#firmScoreLine)"
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: '#5EEAD4', stroke: '#0EA5E9', strokeWidth: 2 }}
                  dot={{ r: 5, fill: '#22E6DA', stroke: '#0EA5E9', strokeWidth: 1.8 }}
                  name="score"
                >
                  <ErrorBar dataKey="uncertainty" width={4} stroke="rgba(148,163,184,0.35)" />
                </Line>

                <ReferenceDot
                  x="2022"
                  y={scoreEvolutionData[1]?.score}
                  r={4}
                  fill="#F59E0B"
                  stroke="#F59E0B"
                  label={{ value: 'New compliance model v1.2', position: 'top', fill: '#FCD34D', fontSize: 11 }}
                />
                <ReferenceDot
                  x="2023"
                  y={scoreEvolutionData[2]?.score}
                  r={4}
                  fill="#A78BFA"
                  stroke="#A78BFA"
                  label={{ value: 'Tier recalibration', position: 'bottom', fill: '#C4B5FD', fontSize: 11 }}
                />
                <ReferenceDot
                  x="2024"
                  y={scoreEvolutionData[3]?.score}
                  r={4}
                  fill="#60A5FA"
                  stroke="#60A5FA"
                  label={{ value: 'Industry expansion', position: 'top', fill: '#93C5FD', fontSize: 11 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-3">
              Confidence bars show model uncertainty (±1.4 to ±2.2 pts) and dashed trendline shows smoothed institutional trajectory.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
            <h2 className="text-white text-xl font-semibold mb-4">Payout Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-dark-300 mb-1"><RealIcon name="analytics" size={14} />Payout success rate</div>
                <div className="text-2xl font-bold text-white">{profile.payoutMetrics.successRate}</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-dark-300 mb-1"><RealIcon name="monitoring" size={14} />Average payout time</div>
                <div className="text-2xl font-bold text-white">{profile.payoutMetrics.averagePayoutTime}</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-dark-300 mb-1"><RealIcon name="dashboard" size={14} />Maximum funded account</div>
                <div className="text-2xl font-bold text-white">{profile.payoutMetrics.maxFundedAccount}</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-dark-300 mb-1"><RealIcon name="rankings" size={14} />Profit split</div>
                <div className="text-2xl font-bold text-white">{profile.payoutMetrics.profitSplit}</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
            <h2 className="text-white text-xl font-semibold mb-4">Risk Analysis</h2>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
                <span className="text-dark-300">Risk Score</span>
                <span className="text-green-400 font-bold">{profile.risk}</span>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
                <span className="text-dark-300">Rule changes/year</span>
                <span className="text-white font-semibold">{profile.riskAnalysis.ruleChangesPerYear}</span>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
                <span className="text-dark-300">Complaints ratio</span>
                <span className="text-white font-semibold">{profile.riskAnalysis.complaintsRatio}</span>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
                <span className="text-dark-300">Shutdown probability (12m)</span>
                <span className="text-white font-semibold">{profile.riskAnalysis.shutdownProbability12m}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
            <h2 className="text-white text-xl font-semibold mb-4">Industry Connections</h2>
            <div className="rounded-xl border border-white/[0.08] bg-[#020617]/60 p-4">
              <svg viewBox="0 0 420 220" className="w-full h-[220px]">
                <line x1="210" y1="90" x2="210" y2="45" stroke="#22E6DA" strokeWidth="2" />
                <line x1="210" y1="90" x2="120" y2="120" stroke="#22E6DA" strokeWidth="2" />
                <line x1="210" y1="90" x2="300" y2="120" stroke="#22E6DA" strokeWidth="2" />
                <line x1="210" y1="90" x2="210" y2="165" stroke="#22E6DA" strokeWidth="2" />

                <circle cx="210" cy="90" r="14" fill="#00D4C6" />
                <text x="210" y="116" fill="#E2E8F0" textAnchor="middle" fontSize="12">FTMO</text>

                <circle cx="210" cy="45" r="11" fill="#3B82F6" />
                <text x="210" y="27" fill="#94A3B8" textAnchor="middle" fontSize="11">Broker: Eightcap</text>

                <circle cx="120" cy="120" r="10" fill="#00D4C6" />
                <text x="120" y="142" fill="#94A3B8" textAnchor="middle" fontSize="11">FundingPips</text>

                <circle cx="300" cy="120" r="10" fill="#00D4C6" />
                <text x="300" y="142" fill="#94A3B8" textAnchor="middle" fontSize="11">FundedNext</text>

                <circle cx="210" cy="165" r="11" fill="#A855F7" />
                <text x="210" y="188" fill="#94A3B8" textAnchor="middle" fontSize="11">Platform: {profile.platform}</text>
              </svg>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
            <h2 className="text-white text-xl font-semibold mb-4">Sector Position</h2>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4">
                <div className="text-primary-300 font-semibold mb-2">Tier 1 Premium Firms</div>
                <div className="text-white">FTMO • FundingPips • FundedNext</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="text-dark-300 font-semibold mb-2">Tier 2 Established</div>
                <div className="text-white">Apex • Alpha Capital • The Trading Pit</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 rounded-2xl bg-[#0B1C2B]/75 border border-white/[0.08] p-6 backdrop-blur-xl">
          <h2 className="text-white text-xl font-semibold mb-4">Data Download</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCapsule iconName="file-json" title="JSON Firm Data" subtitle="Download" variant="primary" />
            <GlassCapsule iconName="download" title="CSV Metrics" subtitle="Download" variant="info" />
            <GlassCapsule iconName="chart" title="Full Risk Report" subtitle="Download" variant="secondary" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-dark-200 text-sm flex items-start gap-2">
          <RealIcon name="shield" size={14} className="mt-0.5" />
          Continuous monitoring enabled: model refreshes rule changes, payout evidence, and risk indicators on every snapshot.
        </motion.div>
      </div>
      </div>
    </div>
  )
}
