import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics Terminal - GTIXT',
  description:
    'Real-time prop firm intelligence terminal: compare firms, monitor risk regimes, and export institutional-grade signals.',
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
