import Navigation from '@/components/public/Navigation'
import Footer from '@/components/public/Footer'
import PublicSidebar from '@/components/public/PublicSidebar'
import { NewFirmNotification } from '@/components/public/NewFirmNotification'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[#020617] pt-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 flex gap-6">
          <PublicSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
      <Footer />
      <NewFirmNotification />
    </>
  )
}
