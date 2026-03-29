import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Risk Radar Redirect',
  description:
    'Legacy risk radar alias retained for compatibility and consolidated to the canonical GTIXT radar route.',
  path: '/risk-radar',
  canonicalPath: '/radar',
  noIndex: true,
})

export default function RiskRadarLayout({ children }: { children: React.ReactNode }) {
  return children
}