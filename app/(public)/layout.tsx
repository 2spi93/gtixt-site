import Footer from '@/components/public/Footer'
import PublicSidebar from '@/components/public/PublicSidebar'
import { NewFirmNotification } from '@/components/public/NewFirmNotification'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import RouteBriefingBanner from '@/components/ui/RouteBriefingBanner'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen gtixt-bg-premium inst-client-shell">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pt-6">
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
      </div>
      <Footer />
      <NewFirmNotification />
    </>
  )
}
