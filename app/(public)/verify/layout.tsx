import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Verify Snapshot Integrity',
  description:
    'Verify GTIXT snapshot hashes, provenance, and integrity proofs for institutional due diligence workflows.',
  path: '/verify',
})

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
