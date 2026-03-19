import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - GTIXT',
  description:
    'REST API documentation for GTIXT rankings, firm intelligence, analytics telemetry, and snapshot verification.',
}

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
