'use client'

import { motion } from 'framer-motion'
import GlassCapsule from '@/components/public/GlassCapsule'
import Link from 'next/link'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

const datasets = [
  { name: 'Full Index Snapshot', size: '2.4 MB', records: 245, format: ['JSON', 'CSV'], updated: '2026-02-26', iconName: 'database' as const, variant: 'primary' as const },
  { name: 'Top 100 Firms', size: '980 KB', records: 100, format: ['JSON', 'CSV'], updated: '2026-02-26', iconName: 'trending-up' as const, variant: 'success' as const },
  { name: 'Risk Analytics', size: '1.2 MB', records: 245, format: ['JSON'], updated: '2026-02-26', iconName: 'chart' as const, variant: 'secondary' as const },
  { name: 'Historical Performance', size: '8.5 MB', records: 7350, format: ['JSON', 'CSV'], updated: '2026-02-26', iconName: 'clock' as const, variant: 'info' as const },
]

const apiEndpoints = [
  { method: 'GET', path: '/api/index/latest', description: 'Get latest GTIXT index snapshot' },
  { method: 'GET', path: '/api/firms', description: 'List all firms with scores' },
  { method: 'GET', path: '/api/firms/:slug', description: 'Get detailed firm data' },
  { method: 'GET', path: '/api/rankings', description: 'Get ranked firms with filters' },
]

export default function DataPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Enhanced with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/5 
                        border border-cyan-500/20 backdrop-blur-sm mb-6">
            <RealIcon name="api" size={30} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-white">Explore Index </span>
            <GradientText variant="h1">Data & Downloads</GradientText>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl leading-relaxed">
            Institutional-grade transparency, downloadable snapshots, and audit-ready metrics. 
            Access complete datasets for research and analysis.
          </p>
        </motion.div>

        {/* Download Capsules - Premium glassmorphism design */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Available Datasets</h2>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full 
                          bg-white/[0.03] border border-cyan-500/20 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live data</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {datasets.map((dataset, index) => (
              <motion.div
                key={dataset.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCapsule
                  iconName={dataset.iconName}
                  title={dataset.name}
                  subtitle={`${dataset.records.toLocaleString()} records • ${dataset.size} • ${dataset.format.join(', ')}`}
                  variant={dataset.variant}
                  onClick={() => console.log(`Download ${dataset.name}`)}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 rounded-2xl bg-slate-900/40 border border-cyan-500/20 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <RealIcon name="analytics" size={18} className="mt-1" />
                <div>
                  <div className="text-white font-semibold mb-1">Updated Daily</div>
                  <div className="text-sm text-slate-400">All datasets refreshed at 00:00 UTC</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RealIcon name="shield" size={18} className="mt-1" />
                <div>
                  <div className="text-white font-semibold mb-1">SHA-256 Verified</div>
                  <div className="text-sm text-slate-400">
                  <Link href="/verify" className="text-primary-400 hover:text-primary-300">
                    Verify snapshots
                  </Link>
                </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* API Preview - Enhanced glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] 
                   backdrop-blur-xl border border-white/[0.08] p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <RealIcon name="api" size={22} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">API Endpoints</h2>
              <p className="text-slate-400 text-sm">RESTful API for programmatic access</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {apiEndpoints.map((endpoint, index) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] 
                         hover:border-primary-500/30 hover:bg-white/[0.04] 
                         transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-2">
                  <span className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 
                               text-green-400 text-xs font-bold uppercase tracking-wider">
                    {endpoint.method}
                  </span>
                  <code className="text-primary-400 font-mono text-sm group-hover:text-primary-300 transition-colors">
                    {endpoint.path}
                  </code>
                </div>
                <div className="text-slate-400 text-sm pl-[72px]">{endpoint.description}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/[0.05]">
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl 
                       bg-gradient-to-r from-primary-500 to-primary-800 text-white 
                       font-semibold hover:shadow-[0_0_30px_rgba(0,212,198,0.3)] 
                       transition-all duration-300"
            >
              <RealIcon name="api" size={18} />
              View Full API Documentation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
