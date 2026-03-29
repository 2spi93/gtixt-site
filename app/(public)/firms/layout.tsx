import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Firm Directory',
  description:
    'Explore prop firm profiles with score history, risk indicators, payout reliability, and evidence-backed intelligence.',
  path: '/firms',
})

export default function FirmsLayout({ children }: { children: React.ReactNode }) {
  return children
}
