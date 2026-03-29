import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Prop Firm Rankings',
  description:
    'Live rankings of prop trading firms with GTIXT scores, risk tiers, and payout reliability benchmarks.',
  path: '/rankings',
})

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
