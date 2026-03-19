import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Industry Map - GTIXT',
  description:
    'Interactive ecosystem map of prop firms, infrastructure providers, and structural relationships across the industry.',
}

export default function IndustryMapLayout({ children }: { children: React.ReactNode }) {
  return children
}
