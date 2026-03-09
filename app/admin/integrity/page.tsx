'use client'

import IntegrityMonitor from '@/components/admin/IntegrityMonitor'
import { AdminNavigation } from '@/components/design-system/UnifiedNavigation'

export default function AdminIntegrityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <IntegrityMonitor />
      </div>
    </div>
  )
}
