'use client'

import { motion } from 'framer-motion'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { RealIcon } from '@/components/design-system/RealIcon'
import {
  SectorRiskChart,
  SurvivalRateChart,
  ScoreDistributionChart,
  ConcentrationChart,
} from '@/components/analytics/InstitutionalCharts'

const chartCardClass = 'card p-6'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PublicNavigation />
      <div className="pt-24 pb-16 sm:pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ACC1]/10 border border-[#00ACC1]/30 text-[#00838F] text-sm font-medium mb-6">
            <RealIcon name="analytics" size={14} />
            Institutional Analytics
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
            <span style={{ color: 'var(--gtixt-turquoise-deep)' }}>Risk </span>
            <span style={{ color: 'var(--gtixt-turquoise-primary)' }}>Analytics</span>
          </h1>
          <p className="text-[#263238] text-lg max-w-3xl">Sector risk, survival dynamics, score distribution and industry concentration.</p>
          <div className="h-0.5 w-20 mt-6" style={{ background: 'var(--gtixt-turquoise-primary)' }} />
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
          {/* 1. Sector Risk Index - Monthly granularity with zoom/pan */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className={chartCardClass}>
            <div className="mb-5">
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#CFD8DC]">Risk Monitoring</p>
              <h2 className="text-[#00838F] text-xl font-semibold">Sector Risk Index</h2>
              <p className="text-xs text-[#CFD8DC] mt-1">Monthly data (2021-2025) • Zoom with mousewheel • Pan with drag</p>
            </div>
            <SectorRiskChart />
          </motion.div>

          {/* 2. Firm Survival Rate - Weekly data with confidence bands */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} className={chartCardClass}>
            <div className="mb-5">
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#CFD8DC]">Resilience</p>
              <h2 className="text-[#00838F] text-xl font-semibold">Firm Survival Rate</h2>
              <p className="text-xs text-[#CFD8DC] mt-1">Weekly aggregates • Confidence intervals • Spline smoothing</p>
            </div>
            <SurvivalRateChart />
          </motion.div>

          {/* 3. Score Distribution - 500 firms with KDE curve */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }} className={chartCardClass}>
            <div className="mb-5">
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#CFD8DC]">Scoring</p>
              <h2 className="text-[#00838F] text-xl font-semibold">Score Distribution</h2>
              <p className="text-xs text-[#CFD8DC] mt-1">500 firms • KDE density estimation • Histogram + smooth curve</p>
            </div>
            <ScoreDistributionChart />
          </motion.div>

          {/* 4. Industry Concentration - Donut chart with center metric */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }} className={chartCardClass}>
            <div className="mb-5">
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#CFD8DC]">Market Structure</p>
              <h2 className="text-[#00838F] text-xl font-semibold">Industry Concentration</h2>
              <p className="text-xs text-[#CFD8DC] mt-1">Market share distribution • Top 5 vs Long Tail</p>
            </div>
            <ConcentrationChart />
            <p className="mt-4 text-xs text-[#00ACC1]">📊 Market share redistribution (2024)</p>
          </motion.div>
        </div>
      </div>
      </div>
    </div>
  )
}
