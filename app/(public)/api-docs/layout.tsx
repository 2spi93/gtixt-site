import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'API Documentation',
  description:
    'REST API documentation for GTIXT rankings, firm intelligence, analytics telemetry, and snapshot verification.',
  path: '/api-docs',
})

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
