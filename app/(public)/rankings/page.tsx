'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ScoreBar from '@/components/public/ScoreBar'
import RiskBadge from '@/components/public/RiskBadge'
import ShieldBadge from '@/components/public/ShieldBadge'
import { RealIcon } from '@/components/design-system/RealIcon'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { GlassCard, GradientText } from '@/components/design-system/GlassComponents'

// Mock data - in production, fetch from API
const firms = Array.from({ length: 50 }, (_, i) => ({
  rank: i + 1,
  name: `Firm ${i + 1}`,
  slug: `firm-${i + 1}`,
  score: Math.round(90 - i * 1.2),
  payoutReliability: Math.round(85 - i * 0.8),
  ruleStability: Math.round(88 - i * 1.1),
  risk: i < 30 ? 'LOW' : i < 45 ? 'MEDIUM' : 'HIGH',
  jurisdiction: ['UK', 'US', 'CZ', 'AE', 'AU'][i % 5],
  trend: i < 10 ? ((i * 3 + 1) % 5) - 2 : ((i * 5 + 2) % 7) - 3,
}))

export default function RankingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterJurisdiction, setFilterJurisdiction] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const initialJurisdiction = params.get('jurisdiction')
    if (!initialJurisdiction) return
    const normalized = initialJurisdiction.toUpperCase()
    const allowed = new Set(['UK', 'US', 'CZ', 'AE', 'AU'])
    if (allowed.has(normalized)) {
      setFilterJurisdiction(normalized)
    }
  }, [])

  const filteredFirms = firms.filter(firm => {
    const matchesSearch = firm.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesJurisdiction = filterJurisdiction === 'all' || firm.jurisdiction === filterJurisdiction
    const matchesRisk = filterRisk === 'all' || firm.risk === filterRisk
    return matchesSearch && matchesJurisdiction && matchesRisk
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-6">
              <RealIcon name="rankings" size={18} />
              <span className="text-cyan-300 text-sm font-semibold tracking-wide">Live Benchmarks</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-slate-50">Global </span>
              <GradientText variant="h1">Rankings</GradientText>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl leading-relaxed">
              Comprehensive ranking of prop trading firms based on institutional-grade scoring methodology
            </p>
          </motion.div>

          {/* Filters */}
          <GlassCard variant="light" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <RealIcon name="research" size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-60" />
                  <input
                    type="text"
                    placeholder="Search firms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Jurisdiction Filter */}
              <div className="relative">
                <select
                  value={filterJurisdiction}
                  onChange={(e) => setFilterJurisdiction(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                >
                  <option value="all">All Jurisdictions</option>
                  <option value="UK">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CZ">Czech Republic</option>
                  <option value="AE">UAE</option>
                  <option value="AU">Australia</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
              </div>

              {/* Risk Filter */}
              <div className="relative">
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">▾</span>
              </div>
            </div>

            <div className="text-slate-400 text-sm mt-4">
              Showing {filteredFirms.length} of {firms.length} firms
            </div>
          </GlassCard>

          {/* Rankings Table - Premium glassmorphism design */}
          <GlassCard variant="light" className="overflow-hidden p-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/30 text-slate-300 text-sm font-semibold border-b border-cyan-500/20">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Firm</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-2">Payout</div>
              <div className="col-span-2">Risk</div>
              <div className="col-span-1">Region</div>
              <div className="col-span-1">Trend</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-cyan-500/10">
              {filteredFirms.map((firm, index) => (
                <motion.div
                  key={firm.slug}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                >
                  <Link href={`/firms/${firm.slug}`}>
                    <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-800/40
                                  transition-all duration-300 cursor-pointer group
                                  hover:shadow-lg hover:shadow-cyan-500/20">
                      <div className="col-span-1 flex items-center">
                        <ShieldBadge rank={firm.rank} size="sm" />
                      </div>

                      <div className="col-span-3 flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600
                                      flex items-center justify-center text-white font-bold text-sm mr-3
                                      shadow-lg shadow-cyan-500/30">
                          {firm.name[0]}
                        </div>
                        <span className="text-white font-semibold group-hover:text-cyan-300 transition-colors">
                          {firm.name}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="w-full">
                          <ScoreBar score={firm.score} maxScore={100} showValue={true} size="md" />
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <div className="w-full">
                          <ScoreBar score={firm.payoutReliability} maxScore={100} showValue={true} size="sm" />
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center">
                        <RiskBadge risk={firm.risk as 'LOW' | 'MEDIUM' | 'HIGH'} size="sm" />
                      </div>

                      <div className="col-span-1 flex items-center">
                        <span className="px-2 py-1 rounded-lg bg-slate-800/50 border border-cyan-500/20
                                     text-slate-300 text-xs font-medium">
                          {firm.jurisdiction}
                        </span>
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        {firm.trend > 0 ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 
                                        border border-green-500/20 text-green-400">
                            <span className="text-xs font-bold">+{firm.trend}</span>
                          </div>
                        ) : firm.trend < 0 ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 
                                        border border-red-500/20 text-red-400">
                            <span className="text-xs font-bold">-{Math.abs(firm.trend)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
    </div>
  )
}
