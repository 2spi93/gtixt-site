import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Style Guide',
  description:
    'Internal GTIXT design system reference for layout, typography, color, and component standards.',
  path: '/style-guide',
  noIndex: true,
})

export default function StyleGuideLayout({ children }: { children: React.ReactNode }) {
  return children
}