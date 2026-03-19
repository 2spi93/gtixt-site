import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prop Firm Rankings - GTIXT',
  description:
    'Live rankings of prop trading firms with GTIXT scores, risk tiers, and payout reliability benchmarks.',
}

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
