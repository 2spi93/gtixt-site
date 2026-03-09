'use client'

import { motion } from 'framer-motion'
import IndustryMapGraph from '@/components/public/IndustryMapGraph'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { RealIcon } from '@/components/design-system/RealIcon'

export default function IndustryMapPage() {
  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <PublicNavigation />
      <div className="pt-24 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Hero Section with Premium Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#00ACC1]/30 bg-[#00ACC1]/10 mb-4">
              <RealIcon name="galaxy" size={18} />
              <span className="text-[#00838F] text-sm font-semibold tracking-wide">GTIXT INDUSTRY GALAXY</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
              <span style={{ color: 'var(--gtixt-turquoise-deep)' }}>The GTIXT</span>
              <br />
              <span style={{ color: 'var(--gtixt-turquoise-primary)' }}>Industry Galaxy</span>
            </h1>
            <p className="text-lg text-[#263238] max-w-4xl opacity-85 mb-2">
              A structural map of the global proprietary trading ecosystem.
            </p>
            <p className="text-sm text-[#CFD8DC] max-w-4xl">
              Institutional visualization of market participants, regulatory frameworks, and ecosystem dynamics.
            </p>
            <div className="h-0.5 w-20 mt-6" style={{ background: 'var(--gtixt-turquoise-primary)' }} />
          </motion.div>

          {/* Galaxy Canvas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="rounded-lg overflow-hidden border border-[#CFD8DC] shadow-md bg-white"
            style={{ minHeight: '600px' }}
          >
            <IndustryMapGraph />
          </motion.div>

          {/* Information Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
          >
            <div className="card">
              <h3 className="card-title mb-2">Interactive Exploration</h3>
              <p className="text-sm text-[#263238]">
                Hover over nodes to view detailed information. Click to select entities and explore connections within the ecosystem.
              </p>
            </div>
            <div className="card">
              <h3 className="card-title mb-2">Institutional Context</h3>
              <p className="text-sm text-[#263238]">
                All entities are classified by role and governance level. Visual hierarchy indicates market influence and regulatory significance.
              </p>
            </div>
            <div className="card">
              <h3 className="card-title mb-2">Data-Driven Analysis</h3>
              <p className="text-sm text-[#263238]">
                Node positioning reflects relationship strength. Connection lines indicate market flows and regulatory dependencies.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
