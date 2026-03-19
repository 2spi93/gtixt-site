import type { PublicFirmRecord } from './public-firms'
import { computeFirmSignal } from './signal-engine'
import { computeSystemicRisk, detectEarlyWarning } from './risk-engine'

export type MarketInsightTone = 'emerald' | 'amber' | 'red' | 'cyan'

export type MarketInsight = {
  title: string
  summary: string
  tone: MarketInsightTone
  href: string
  kicker: string
}

export function generateMarketInsights(firms: PublicFirmRecord[]): MarketInsight[] {
  const scored = firms.filter((firm) => (firm.score_0_100 ?? 0) > 0)
  const systemic = computeSystemicRisk(scored)

  const rising = scored
    .map((firm) => ({
      name: firm.name || firm.firm_id || 'Unknown firm',
      slug: String(firm.firm_id || firm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      score: firm.score_0_100 ?? 0,
      signal: computeFirmSignal(firm),
    }))
    .filter((firm) => firm.signal.type === 'rising')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const warnings = scored
    .map((firm) => ({
      name: firm.name || firm.firm_id || 'Unknown firm',
      slug: String(firm.firm_id || firm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      warning: detectEarlyWarning(firm),
      score: firm.score_0_100 ?? 0,
    }))
    .filter((firm) => firm.warning)
    .slice(0, 3)

  const stressed = scored
    .map((firm) => ({
      name: firm.name || firm.firm_id || 'Unknown firm',
      slug: String(firm.firm_id || firm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      signal: computeFirmSignal(firm),
    }))
    .filter((firm) => firm.signal.type === 'high-risk' || firm.signal.type === 'deteriorating')
    .slice(0, 3)

  const cards: MarketInsight[] = []

  cards.push({
    kicker: 'Systemic Signal',
    title: systemic.headline,
    summary: systemic.detail,
    tone: systemic.level === 'high' ? 'red' : systemic.level === 'elevated' ? 'amber' : 'cyan',
    href: '/best-prop-firms',
  })

  if (rising.length > 0) {
    cards.push({
      kicker: 'Rising Firms',
      title: 'Strength building in the upper tier',
      summary: `${rising.map((firm) => firm.name).join(', ')} are currently printing rising signals in the validated universe.`,
      tone: 'emerald',
      href: '/best-prop-firms',
    })
  }

  if (warnings.length > 0) {
    cards.push({
      kicker: 'Early Warning',
      title: 'Latent stress detected before red-line failure',
      summary: warnings.map((firm) => `${firm.name} (${firm.warning?.label})`).join(' · '),
      tone: 'amber',
      href: '/best-prop-firms',
    })
  }

  if (stressed.length > 0) {
    cards.push({
      kicker: 'Risk Watch',
      title: 'Immediate operator review required',
      summary: `${stressed.map((firm) => `${firm.name} (${firm.signal.label})`).join(' · ')}`,
      tone: 'red',
      href: '/best-prop-firms',
    })
  }

  return cards.slice(0, 4)
}
