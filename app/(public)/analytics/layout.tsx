import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Analytics Terminal',
  description:
    'Real-time prop firm intelligence terminal: compare firms, monitor risk regimes, and export institutional-grade signals.',
  path: '/analytics',
})

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
