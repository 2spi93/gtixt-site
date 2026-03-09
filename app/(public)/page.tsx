import Hero from '@/components/public/Hero'
import IndexOverview from '@/components/public/IndexOverview'
import TopFirms from '@/components/public/TopFirms'
import SectorRisk from '@/components/public/SectorRisk'
import MethodologyPreview from '@/components/public/MethodologyPreview'
import ResearchArticles from '@/components/public/ResearchArticles'
import KPICard from '@/components/public/KPICard'
import Link from 'next/link'
import { RealIcon } from '@/components/design-system/RealIcon'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-950">
      <Hero />
      
      {/* KPI Dashboard - Premium glassmorphism cards */}
      <section className="px-6 py-16 -mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              label="GTIXT Index"
              value="72.9"
              change="+2.1%"
              changeType="positive"
              iconName="trending-up"
              gradient={true}
            />
            <KPICard
              label="Firms Tracked"
              value="245"
              change="+12 firms"
              changeType="positive"
              iconName="building"
            />
            <KPICard
              label="Sector Risk"
              value="24.8"
              change="LOW"
              changeType="positive"
              iconName="alert"
            />
            <KPICard
              label="Survival Rate"
              value="67%"
              change="+3.2%"
              changeType="positive"
              iconName="target"
            />
          </div>
        </div>
      </section>

      <IndexOverview />
      <TopFirms />
      
      {/* Industry Map Teaser - Premium glassmorphism design */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="relative group rounded-3xl overflow-hidden
                          bg-gradient-to-br from-primary-500/5 via-primary-800/5 to-transparent
                          backdrop-blur-xl border border-primary-500/20
                          hover:border-primary-500/40 transition-all duration-500">
            
            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,212,198,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_50%)]" />
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                          bg-gradient-to-r from-transparent via-primary-500/5 to-transparent" />
            
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                                bg-primary-500/10 border border-primary-500/30 text-primary-400 
                                text-xs font-bold uppercase tracking-wider mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                    New Visual Intelligence
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    Industry Map
                    <span className="block bg-gradient-to-r from-primary-400 via-primary-500 to-primary-800 
                                   bg-clip-text text-transparent">
                      Interactive
                    </span>
                  </h2>
                  
                  <p className="text-lg text-dark-300 max-w-2xl leading-relaxed">
                    Explore the complete ecosystem: hidden relationships between prop firms, brokers, 
                    platforms, liquidity providers, and regulators in an interactive network visualization.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-6">
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      <span>13 Entities</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <div className="w-3 h-3 rounded-full bg-primary-800"></div>
                      <span>24 Connections</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>3 View Modes</span>
                    </div>
                  </div>
                </div>
                
                <Link
                  href="/industry-map"
                  className="group/btn relative px-8 py-4 rounded-xl
                           bg-gradient-to-r from-primary-500 to-primary-800 
                           text-white font-bold text-lg
                           hover:shadow-[0_0_40px_rgba(0,212,198,0.4)]
                           transition-all duration-300
                           overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <RealIcon name="galaxy" size={18} />
                    Open Industry Map
                  </span>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full 
                                transition-transform duration-1000 
                                bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectorRisk />
      <MethodologyPreview />
      <ResearchArticles />
    </main>
  )
}
