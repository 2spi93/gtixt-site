import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Live GTIXT Index',
  description:
    'Monitor live GTIXT index conditions, top-ranked firms, sector dispersion, and real-time radar context from the current ranking universe.',
  path: '/index',
})

export default function IndexLayout({ children }: { children: React.ReactNode }) {
  return children
}