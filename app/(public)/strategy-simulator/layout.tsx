import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Strategy Simulator Redirect',
  description:
    'Legacy strategy simulator alias retained for compatibility and consolidated to the canonical GTIXT simulator route.',
  path: '/strategy-simulator',
  canonicalPath: '/simulator',
  noIndex: true,
})

export default function StrategySimulatorLayout({ children }: { children: React.ReactNode }) {
  return children
}