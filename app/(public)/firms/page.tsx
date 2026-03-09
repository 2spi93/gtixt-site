'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import ScoreBar from '@/components/public/ScoreBar'
import RiskBadge from '@/components/public/RiskBadge'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { GlassCard, GradientText } from '@/components/design-system/GlassComponents'

interface Firm {
  slug: string
  name: string
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  jurisdiction: string
  jurisdictionName: string
  platform: string
  payout: number
  tradersFunded: string
  trend: string
}

const firms: Firm[] = [
  { 
    slug: 'ftmo', 
    name: 'FTMO', 
    score: 92.4, 
    risk: 'LOW', 
    jurisdiction: 'CZ', 
    jurisdictionName: 'Czech Republic',
    platform: 'MT5',
    payout: 94,
    tradersFunded: '~180k',
    trend: '+2.1%'
  },
  { 
    slug: 'fundingpips', 
    name: 'FundingPips', 
    score: 90.5, 
    risk: 'LOW', 
    jurisdiction: 'AE',
    jurisdictionName: 'United Arab Emirates',
    platform: 'MT5',
    payout: 90,
    tradersFunded: '~65k',
    trend: '+1.8%'
  },
  { 
    slug: 'topstep', 
    name: 'Topstep', 
    score: 87.3, 
    risk: 'MEDIUM', 
    jurisdiction: 'US',
    jurisdictionName: 'United States',
    platform: 'cTrader',
    payout: 87,
    tradersFunded: '~48k',
    trend: '+0.5%'
  },
  { 
    slug: 'apex', 
    name: 'Apex Trader', 
    score: 88.1, 
    risk: 'LOW', 
    jurisdiction: 'US',
    jurisdictionName: 'United States',
    platform: 'MT5',
    payout: 89,
    tradersFunded: '~52k',
    trend: '+1.2%'
  },
]

export default function FirmsPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => firms.filter((firm) => firm.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-12"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-6">
            <RealIcon name="firms" size={18} />
            <span className="text-cyan-300 text-sm font-semibold tracking-wide">Institutional Directory</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-3">
            <GradientText variant="h1">Prop Trading Firms</GradientText>
          </h1>
          <p className="text-slate-300 text-xl max-w-3xl">
            {filtered.length} institutional firms ranked by GTIXT score, payout reliability, and risk profile.
          </p>
        </motion.div>

        {/* Search Bar - Premium */}
        <div className="mb-10 relative">
          <RealIcon name="research" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search firms by name..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800/50 backdrop-blur border border-cyan-500/30
                     text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500
                     transition-all"
          />
        </div>

        {/* Firms Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((firm, index) => (
            <motion.div
              key={firm.slug}
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <GlassCard variant="light" className="group p-6 transition-all duration-300 cursor-pointer hover:shadow-cyan-500/30">
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                {/* Top Section - Firm Header */}
                <div className="flex items-start justify-between mb-5 pb-5 border-b border-cyan-500/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20
                                  border border-cyan-500/30 flex items-center justify-center text-white
                                  group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-colors">
                      <RealIcon name="firms" size={22} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{firm.name}</h3>
                      <p className="text-slate-400 text-sm">{firm.jurisdictionName}</p>
                    </div>
                  </div>
                </div>

                {/* Score & Payout Row */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{firm.score}</span>
                      <span className="text-xs text-cyan-400 font-semibold">{firm.trend}</span>
                    </div>
                    <ScoreBar score={firm.score} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Payout Rate</p>
                    <div className="text-2xl font-bold text-white">{firm.payout}%</div>
                    <div className="mt-1 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" 
                        style={{ width: `${firm.payout}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Risk Level</p>
                    <RiskBadge risk={firm.risk} />
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 mb-6 pt-5 border-t border-cyan-500/10">
                  <div className="text-sm">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Platform</p>
                    <p className="text-white font-semibold">{firm.platform}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Traders Funded</p>
                    <p className="text-white font-semibold">{firm.tradersFunded}</p>
                  </div>
                </div>

                {/* CTA Button */}
                <Link 
                  href={`/firms/${firm.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-gradient-to-r from-cyan-500/10 to-cyan-400/5 border border-cyan-500/30
                           hover:from-cyan-500/20 hover:to-cyan-400/15 hover:border-cyan-400/50
                           text-cyan-300 hover:text-cyan-200 font-semibold transition-all duration-300
                           shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                >
                  View Full Profile
                </Link>
              </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <RealIcon name="firms" size={44} className="opacity-40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No firms found</h3>
            <p className="text-slate-400">Try adjusting your search criteria</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
