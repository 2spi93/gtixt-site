'use client'

import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import KPICard from '@/components/public/KPICard'
import GlassCapsule from '@/components/public/GlassCapsule'
import RiskBadge from '@/components/public/RiskBadge'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

// Mock data for charts
const indexData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  gtixt: 70 + Math.random() * 5,
  risk: 20 + Math.random() * 10,
}))

const distributionData = [
  { name: 'Low Risk', value: 67, color: '#22C55E' },
  { name: 'Medium Risk', value: 28, color: '#F59E0B' },
  { name: 'High Risk', value: 5, color: '#EF4444' },
]

interface TopFirm {
  rank: number
  name: string
  score: number
  payout: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  jurisdiction: string
}

const topFirms: TopFirm[] = [
  { rank: 1, name: 'FTMO', score: 92.4, payout: 94, risk: 'LOW', jurisdiction: 'CZ' },
  { rank: 2, name: 'FundedNext', score: 91.2, payout: 92, risk: 'LOW', jurisdiction: 'UAE' },
  { rank: 3, name: 'FundingPips', score: 90.5, payout: 90, risk: 'LOW', jurisdiction: 'UK' },
  { rank: 4, name: 'Apex Trader', score: 88.1, payout: 89, risk: 'LOW', jurisdiction: 'US' },
]

const sectorRiskTiers = [
  { tier: 'Tier 1 Premium', count: 18, percentage: 7, color: '#00D4C6' },
  { tier: 'Tier 2 Established', count: 67, percentage: 28, color: '#22E6DA' },
  { tier: 'Tier 3 Growth', count: 128, percentage: 53, color: '#0EA5E9' },
  { tier: 'Tier 4 High Risk', count: 32, percentage: 13, color: '#F59E0B' },
]

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <GradientText variant="h1">GTIXT Index</GradientText>
            <span className="text-white"> Dashboard</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl leading-relaxed">
            Real-time institutional-grade analytics for the global prop trading industry
          </p>
        </motion.div>

        {/* KPI Cards - Premium glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KPICard
            label="GTIXT Index"
            value="72.9"
            change="+1.4"
            changeType="positive"
            iconName="chart"
            gradient={true}
          />
          <KPICard
            label="Risk Index"
            value="24.8"
            change="-2.1"
            changeType="positive"
            iconName="shield"
          />
          <KPICard
            label="Active Firms"
            value="245"
            change="+4 firms"
            changeType="positive"
            iconName="activity"
          />
          <KPICard
            label="Survival Rate"
            value="67.1%"
            change="+1.2%"
            changeType="positive"
            iconName="trending-up"
          />
        </div>

        {/* Charts - Premium glassmorphism design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Index Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-6
                     hover:border-cyan-400/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <RealIcon name="rankings" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">GTIXT Index Performance</h3>
                <p className="text-sm text-slate-400">30-day trend</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indexData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00D4C6" />
                    <stop offset="50%" stopColor="#22E6DA" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(11, 28, 43, 0.95)', 
                    border: '1px solid rgba(0, 212, 198, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gtixt" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={3} 
                  dot={false}
                  filter="drop-shadow(0 0 8px rgba(0, 212, 198, 0.5))"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Risk Index Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-6
                     hover:border-green-500/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <RealIcon name="shield" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Risk Index Trend</h3>
                <p className="text-sm text-slate-400">Lower is better</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={indexData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(11, 28, 43, 0.95)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="risk" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRisk)"
                  filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Risk Distribution - Premium design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <RealIcon name="analytics" size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">Risk Distribution</h3>
              <p className="text-sm text-slate-400">Across all tracked firms</p>
            </div>
          </div>
          <div className="space-y-6">
            {distributionData.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="text-white font-bold text-base">{item.value}%</span>
                </div>
                <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{ 
                      backgroundColor: item.color,
                      boxShadow: `0 0 15px ${item.color}60`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                  animate-pulse"></div>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sector Risk Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 p-8 mt-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <RealIcon name="operations" size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">Sector Risk Map</h3>
              <p className="text-sm text-slate-400">Industry tier distribution</p>
            </div>
          </div>
          <div className="space-y-4">
            {sectorRiskTiers.map((tier, index) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-semibold">{tier.tier}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{tier.count} firms</span>
                    <span className="text-slate-500 text-sm">{tier.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tier.percentage}%` }}
                    transition={{ duration: 1.2, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: tier.color,
                      boxShadow: `0 0 12px ${tier.color}70`
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Firms Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/25 overflow-hidden mt-8"
        >
          <div className="p-8 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <RealIcon name="rankings" size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Top Firms</h3>
                <p className="text-sm text-slate-400">Best performing platforms</p>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-800/30 border-b border-cyan-500/20 text-slate-400 text-sm font-semibold">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Firm</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Payout</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-1">Country</div>
          </div>

          {/* Table Rows */}
          {topFirms.map((firm, index) => (
            <motion.div
              key={firm.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors group"
            >
              <div className="col-span-1 text-white font-bold text-lg">{firm.rank}</div>
              <div className="col-span-4">
                <p className="text-white font-semibold group-hover:text-primary-400 transition-colors">{firm.name}</p>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{firm.score}</span>
                  <span className="text-primary-400 text-sm">██████</span>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-white font-semibold">{firm.payout}%</span>
              </div>
              <div className="col-span-2">
                <RiskBadge risk={firm.risk} />
              </div>
              <div className="col-span-1">
                <span className="text-slate-400 font-semibold">{firm.jurisdiction}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Downloads Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <h3 className="text-2xl font-semibold text-white mb-6">Data Downloads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCapsule
              iconName="download"
              title="JSON Snapshot"
              subtitle="Complete dataset"
              variant="primary"
            />
            <GlassCapsule
              iconName="download"
              title="CSV Dataset"
              subtitle="Historical metrics"
              variant="info"
            />
            <GlassCapsule
              iconName="download"
              title="Top 100 Firms"
              subtitle="Premium firms"
              variant="secondary"
            />
            <GlassCapsule
              iconName="download"
              title="Risk Analytics"
              subtitle="Full report"
              variant="primary"
            />
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
