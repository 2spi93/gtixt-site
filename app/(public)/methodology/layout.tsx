import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Methodology',
  description:
    'Learn how GTIXT computes prop firm scores, risk models, payout reliability, and evidence-backed verification metrics.',
  path: '/methodology',
})

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return children
}
