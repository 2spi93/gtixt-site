import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Research - GTIXT',
  description:
    'Data-driven prop firm research, risk reports, and failure pattern analysis built from GTIXT evidence and ranking telemetry.',
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
