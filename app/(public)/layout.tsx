import Footer from '@/components/public/Footer'
import PublicSidebar from '@/components/public/PublicSidebar'
import { NewFirmNotification } from '@/components/public/NewFirmNotification'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import RouteBriefingBanner from '@/components/ui/RouteBriefingBanner'
import PublicEngagementTracker from '@/components/analytics/PublicEngagementTracker'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicEngagementTracker />
      <PublicNavigation />
      <main id="main-content" className="relative min-h-screen gtixt-bg-premium inst-client-shell overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-28 h-[360px] w-[360px] opacity-[0.08] blur-[0.2px]"
          style={{
            backgroundImage: 'url(/brand/watermark-symbol.svg)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-20 h-[300px] w-[300px] opacity-[0.06]"
          style={{
            backgroundImage: 'url(/brand/watermark-symbol.svg)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            transform: 'rotate(18deg)',
          }}
        />
        <div
          className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pt-6"
          role="region"
          aria-label="Institutional trust indicators"
        >
          <div className="inst-client-ribbon" aria-label="Institutional trust indicators">
            <span className="inst-client-chip">Institutional Benchmark</span>
            <span className="inst-client-chip">Methodology Transparency</span>
            <span className="inst-client-chip">Continuous Risk Monitoring</span>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 flex gap-6">
          <PublicSidebar />
          <div className="flex-1 min-w-0 inst-client-main-panel">
            <div className="inst-client-content-stack">
              <RouteBriefingBanner scope="public" />
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <NewFirmNotification />
    </>
  )
}
