'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface Firm {
  rank: number
  name: string
  slug: string
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  jurisdiction: string
  trend: number
}

const topFirms: Firm[] = [
  { rank: 1, name: 'FTMO', slug: 'ftmo', score: 92, risk: 'LOW', jurisdiction: 'CZ', trend: +2 },
  { rank: 2, name: 'FundingPips', slug: 'fundingpips', score: 89, risk: 'LOW', jurisdiction: 'UK', trend: +1 },
  { rank: 3, name: 'Topstep', slug: 'topstep', score: 87, risk: 'LOW', jurisdiction: 'US', trend: 0 },
  { rank: 4, name: 'FundedNext', slug: 'fundednext', score: 85, risk: 'LOW', jurisdiction: 'AE', trend: -1 },
  { rank: 5, name: 'Apex Trader', slug: 'apex-trader', score: 88, risk: 'MEDIUM', jurisdiction: 'US', trend: +3 },
]

function RiskBadge({ risk }: { risk: Firm['risk'] }) {
  const colors = {
    LOW: 'bg-success/10 text-success border-success/20',
    MEDIUM: 'bg-warning/10 text-warning border-warning/20',
    HIGH: 'bg-danger/10 text-danger border-danger/20',
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[risk]}`}>
      {risk} RISK
    </span>
  )
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend === 0) return <span className="text-dark-500">—</span>
  
  const Icon = trend > 0 ? TrendingUp : TrendingDown
  const color = trend > 0 ? 'text-success' : 'text-danger'
  
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{Math.abs(trend)}</span>
    </div>
  )
}

export default function TopFirms() {
  return (
    <section className="py-20 px-6 bg-dark-900 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Top Rated Firms
            </h2>
            <p className="text-dark-300 text-lg">
              Industry leaders ranked by institutional score
            </p>
          </div>
          <Link href="/rankings">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-primary-500/10 text-primary-400 font-medium rounded-lg border border-primary-500/20 hover:bg-primary-500/20 transition-all"
            >
              View All Rankings
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-900/50 backdrop-blur-sm">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-dark-800/50 text-dark-400 text-sm font-medium border-b border-dark-700">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Firm</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-2">Jurisdiction</div>
            <div className="col-span-1">Trend</div>
          </div>

          {/* Rows */}
          {topFirms.map((firm, index) => (
            <motion.div
              key={firm.slug}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/firms/${firm.slug}`}>
                <div className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-dark-700 hover:bg-dark-800/50 transition-all duration-200 cursor-pointer group">
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-2xl font-bold text-primary-400">#{firm.rank}</span>
                  </div>

                  {/* Firm */}
                  <div className="col-span-4 flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-turquoise flex items-center justify-center text-white font-bold mr-3">
                      {firm.name[0]}
                    </div>
                    <span className="text-white font-semibold group-hover:text-primary-400 transition-colors">
                      {firm.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{firm.score}</span>
                      <span className="text-xs text-dark-400">/100</span>
                    </div>
                  </div>

                  {/* Risk */}
                  <div className="col-span-2 flex items-center">
                    <RiskBadge risk={firm.risk} />
                  </div>

                  {/* Jurisdiction */}
                  <div className="col-span-2 flex items-center">
                    <span className="px-3 py-1 rounded-full bg-dark-800 text-dark-300 text-sm font-medium">
                      {firm.jurisdiction}
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="col-span-1 flex items-center justify-center">
                    <TrendIndicator trend={firm.trend} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 md:hidden">
          <Link href="/rankings">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500/10 text-primary-400 font-medium rounded-lg border border-primary-500/20">
              View All Rankings
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
