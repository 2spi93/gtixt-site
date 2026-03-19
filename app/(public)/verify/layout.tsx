import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Snapshot Integrity - GTIXT',
  description:
    'Verify GTIXT snapshot hashes, provenance, and integrity proofs for institutional due diligence workflows.',
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
