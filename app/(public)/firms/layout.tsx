import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Firm Directory - GTIXT',
  description:
    'Explore prop firm profiles with score history, risk indicators, payout reliability, and evidence-backed intelligence.',
}

export default function FirmsLayout({ children }: { children: React.ReactNode }) {
  return children
}
