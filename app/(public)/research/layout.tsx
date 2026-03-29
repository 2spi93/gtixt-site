import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Research',
  description:
    'Data-driven prop firm research, risk reports, and failure pattern analysis built from GTIXT evidence and ranking telemetry.',
  path: '/research',
})

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
