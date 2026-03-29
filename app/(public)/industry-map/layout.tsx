import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Industry Map',
  description:
    'Interactive ecosystem map of prop firms, infrastructure providers, and structural relationships across the industry.',
  path: '/industry-map',
})

export default function IndustryMapLayout({ children }: { children: React.ReactNode }) {
  return children
}
