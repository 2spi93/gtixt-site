import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology - GTIXT',
  description:
    'Learn how GTIXT computes prop firm scores, risk models, payout reliability, and evidence-backed verification metrics.',
}

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return children
}
