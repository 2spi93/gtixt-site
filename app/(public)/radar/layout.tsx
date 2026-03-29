import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Risk Radar',
  description:
    'Early-warning radar for prop firms with collapse probability, new alerts, and stability ranking from live evidence.',
  path: '/radar',
})

export default function RadarLayout({ children }: { children: React.ReactNode }) {
  return children
}
