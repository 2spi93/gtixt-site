import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Data Access',
  description:
    'Access GTIXT datasets, endpoint references, and downloadable intelligence layers for prop firm analysis.',
  path: '/data',
})

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return children
}
