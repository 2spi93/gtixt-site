import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Risk Radar - GTIXT',
  description:
    'Early-warning radar for prop firms with collapse probability, new alerts, and stability ranking from live evidence.',
}

export default function RadarLayout({ children }: { children: React.ReactNode }) {
  return children
}
