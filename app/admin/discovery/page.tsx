import { DiscoveryConfigPanel } from '@/components/admin/DiscoveryConfigPanel'

export const metadata = {
  title: 'Discovery Configuration | GTIXT Admin',
  description: 'Configure autonomous firm discovery parameters',
}

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-8">
      <div className="max-w-6xl mx-auto">
        <DiscoveryConfigPanel />
      </div>
    </div>
  )
}
