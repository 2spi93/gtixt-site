import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Access - GTIXT',
  description:
    'Access GTIXT datasets, endpoint references, and downloadable intelligence layers for prop firm analysis.',
}

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return children
}
