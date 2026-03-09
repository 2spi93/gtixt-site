'use client'

import { motion } from 'framer-motion'
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon'
import { GlassCard, GradientText } from '@/components/design-system/GlassComponents'

const pillars = [
  {
    name: 'Payout Reliability',
    weight: '30%',
    icon: 'analytics' as RealIconName,
    description: 'Track record of honoring trader payouts, evidence-based verification',
    metrics: ['Payout success rate', 'Processing time', 'Dispute resolution', 'User testimonials']
  },
  {
    name: 'Rule Fairness',
    weight: '20%',
    icon: 'review' as RealIconName,
    description: 'Analysis of trading rules, drawdown limits, and profit targets',
    metrics: ['Rule clarity', 'Target achievability', 'Consistency score', 'Hidden clauses']
  },
  {
    name: 'Regulatory Compliance',
    weight: '20%',
    icon: 'shield' as RealIconName,
    description: 'Licensing, registration, and regulatory standing across jurisdictions',
    metrics: ['FCA status', 'ASIC registration', 'SEC compliance', 'MiFID II adherence']
  },
  {
    name: 'Longevity & Stability',
    weight: '15%',
    icon: 'operations' as RealIconName,
    description: 'Operational history, funding rounds, and market presence',
    metrics: ['Years in operation', 'Leadership transparency', 'Domain age', 'Traffic trends']
  },
  {
    name: 'Sentiment Analysis',
    weight: '15%',
    icon: 'research' as RealIconName,
    description: 'Community sentiment, review patterns, and social signals',
    metrics: ['Trustpilot score', 'Reddit sentiment', 'YouTube reviews', 'Twitter mentions']
  }
]

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6 backdrop-blur-sm">
            Institutional-Grade Framework
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <GradientText variant="h1">GTIXT Methodology</GradientText>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            A transparent, evidence-based scoring framework for prop trading firms. 
            Five pillars, 23 metrics, immutable snapshots.
          </p>
        </motion.div>

        {/* Scoring Formula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-slate-900/40 backdrop-blur-md border border-cyan-500/30 p-8 mb-16"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Scoring Formula</h2>
          <div className="bg-slate-950/80 rounded-lg p-6 font-mono text-sm text-slate-200 overflow-x-auto border border-cyan-500/20">
            <div className="text-cyan-300 mb-4">GTIXT_Score = (</div>
            <div className="ml-8 space-y-1">
              <div>0.30 × Payout_Reliability +</div>
              <div>0.20 × Rule_Fairness +</div>
              <div>0.20 × Regulatory_Compliance +</div>
              <div>0.15 × Longevity_Stability +</div>
              <div>0.15 × Sentiment_Analysis</div>
            </div>
            <div className="text-cyan-300 mt-4">) × 100</div>
          </div>
          <p className="text-slate-400 text-sm mt-4">
            Final score ranges from 0 to 100. Scores above 80 indicate institutional-grade quality.
          </p>
        </motion.div>

        {/* Five Pillars */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8"><GradientText variant="h2">Five Core Pillars</GradientText></h2>
          <div className="space-y-6">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 hover:border-cyan-400/50 transition-all card-glow backdrop-blur-md"
              >
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <RealIcon name={pillar.icon} size={30} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-semibold text-white">{pillar.name}</h3>
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-sm font-semibold border border-cyan-500/30">
                        {pillar.weight}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-6">{pillar.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pillar.metrics.map((metric) => (
                        <div
                          key={metric}
                          className="flex items-center gap-2 text-sm text-slate-400"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Governance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Governance & Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-cyan-300 mb-2">Daily</div>
              <div className="text-slate-300 text-sm">Snapshot updates with SHA-256 immutability</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-300 mb-2">Quarterly</div>
              <div className="text-slate-300 text-sm">Index rebalancing with governance review</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-300 mb-2">Open</div>
              <div className="text-slate-300 text-sm">Full methodology transparency and auditability</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
