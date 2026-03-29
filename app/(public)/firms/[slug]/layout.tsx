import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { loadPublicFirmUniverse, normalizePublicFirmSlug } from '@/lib/public-firms'
import { buildPublicMetadata } from '@/lib/seo'

function normalizeRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 80) return 'low'
  if (score >= 65) return 'medium'
  return 'high'
}

function resolveFirm(slug: string, firms: Awaited<ReturnType<typeof loadPublicFirmUniverse>>['firms']) {
  const normalizedSlug = normalizePublicFirmSlug(slug)

  return firms.find((firm) => {
    const byFirmId = firm.firm_id ? normalizePublicFirmSlug(firm.firm_id) : ''
    const byName = firm.name ? normalizePublicFirmSlug(firm.name) : ''
    return byFirmId === normalizedSlug || byName === normalizedSlug
  })
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params
  const normalizedSlug = normalizePublicFirmSlug(slug)
  const path = `/firms/${normalizedSlug}`

  try {
    const { firms } = await loadPublicFirmUniverse()
    const firm = resolveFirm(slug, firms)

    if (!firm?.name) {
      return buildPublicMetadata({
        title: 'Firm profile unavailable',
        description: 'This GTIXT firm profile is currently unavailable or no longer indexed.',
        path,
        noIndex: true,
      })
    }

    const score = Number(firm.score_0_100 || 0)
    const risk = normalizeRisk(score)
    const descriptionParts = [
      `${firm.name} GTIXT profile with ${score}/100 integrity score`,
      `${risk} risk rating`,
      firm.jurisdiction ? `${firm.jurisdiction} jurisdiction` : null,
      'payout reliability, operational stability, and historical consistency data',
    ].filter(Boolean)

    return buildPublicMetadata({
      title: `${firm.name} Review & Integrity Score`,
      description: `${descriptionParts.join(', ')}.`,
      path,
      keywords: [
        firm.name,
        firm.firm_id,
        firm.jurisdiction,
        'prop firm review',
        'firm integrity score',
        'payout reliability',
      ].filter(Boolean) as string[],
    })
  } catch {
    return buildPublicMetadata({
      title: 'Firm profiles',
      description: 'Institutional-grade GTIXT firm profiles covering payout reliability, risk integrity, and operational stability.',
      path,
    })
  }
}

export default function FirmProfileLayout({ children }: { children: ReactNode }) {
  return children
}