'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Calculator, Shield, Database, ArrowRight } from 'lucide-react'
import InfoTooltip from '@/components/ui/InfoTooltip'

const methodologyHighlights = [
  {
    icon: <Calculator className="w-6 h-6" />,
    title: '5 Core Metrics',
    description: 'Payout Reliability, Rule Stability, Regulatory Score, Firm Longevity, Trader Sentiment',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Independent Validation',
    description: 'Agent-based verification with multi-source cross-validation',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'Immutable Snapshots',
    description: 'SHA-256 hashed quarterly rebalancing with full audit trail',
  },
]

export default function MethodologyPreview() {
  return (
    <section className="py-20 px-6 bg-dark-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Institutional Methodology
            </h2>
            <InfoTooltip
              content="Transparent framework describing how GTIXT converts evidence into standardized scores."
              example="Weights and normalization rules are published to make comparisons auditable."
              label="Institutional methodology explanation"
            />
          </div>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Bloomberg-grade scoring framework designed for institutional transparency
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {methodologyHighlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl bg-dark-950/50 border border-dark-700 p-6 hover:border-primary-500/50 transition-all"
            >
              <div className="p-3 rounded-lg bg-primary-500/10 w-fit mb-4">
                <div className="text-primary-400">{item.icon}</div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-dark-300 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Formula Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl bg-dark-950/50 border border-primary-500/20 p-8 mb-8"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            GTIXT Score Formula
            <InfoTooltip
              content="Illustrative formula showing the relative contribution of each scoring pillar."
              example="Changing one pillar moves the total score proportionally to its weight."
              label="GTIXT score formula explanation"
            />
          </h3>
          <div className="font-mono text-dark-300 text-sm space-y-1">
            <div className="text-white">GTIXT Score =</div>
            <div className="pl-4">0.30 × <span className="text-primary-400">Payout Reliability</span></div>
            <div className="pl-4">0.20 × <span className="text-primary-400">Rule Stability</span></div>
            <div className="pl-4">0.20 × <span className="text-primary-400">Regulatory Score</span></div>
            <div className="pl-4">0.15 × <span className="text-primary-400">Firm Longevity</span></div>
            <div className="pl-4">0.15 × <span className="text-primary-400">Trader Sentiment</span></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/methodology">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500/10 text-primary-400 font-semibold rounded-lg border border-primary-500/20 hover:bg-primary-500/20 transition-all"
            >
              Read Full Methodology
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
