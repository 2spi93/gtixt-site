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

export type InsightFirm = {
  name: string
  slug: string
  score: number
}

export type WarningFirm = InsightFirm & {
  label: string
  severity: 'watch' | 'caution'
}

export type StressedFirm = InsightFirm & {
  signalLabel: string
}

export type MarketInsightsReport = {
  insights: MarketInsight[]
  rising: InsightFirm[]
  warnings: WarningFirm[]
  stressed: StressedFirm[]
}

export function buildMarketInsightsReport(firms: PublicFirmRecord[]): MarketInsightsReport {
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
    .map((firm) => ({
      name: firm.name,
      slug: firm.slug,
      score: firm.score,
      label: firm.warning?.label || 'Early Warning',
      severity: firm.warning?.severity || 'watch',
    }))
    .slice(0, 3)

  const stressed = scored
    .map((firm) => ({
      name: firm.name || firm.firm_id || 'Unknown firm',
      slug: String(firm.firm_id || firm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      signal: computeFirmSignal(firm),
    }))
    .filter((firm) => firm.signal.type === 'high-risk' || firm.signal.type === 'deteriorating')
    .map((firm) => ({
      name: firm.name,
      slug: firm.slug,
      score: 0,
      signalLabel: firm.signal.label,
    }))
    .slice(0, 3)

  const cards: MarketInsight[] = []

  cards.push({
    kicker: 'Systemic Signal',
    title: systemic.headline,
    summary: systemic.detail,
    tone: systemic.level === 'high' ? 'red' : systemic.level === 'elevated' ? 'amber' : 'cyan',
    href: '/insights',
  })

  if (rising.length > 0) {
    cards.push({
      kicker: 'Rising Firms',
      title: 'Strength building in the upper tier',
      summary: `${rising.map((firm) => firm.name).join(', ')} are currently printing rising signals in the validated universe.`,
      tone: 'emerald',
      href: '/insights',
    })
  }

  if (warnings.length > 0) {
    cards.push({
      kicker: 'Early Warning',
      title: 'Latent stress detected before red-line failure',
      summary: warnings.map((firm) => `${firm.name} (${firm.label})`).join(' · '),
      tone: 'amber',
      href: '/insights',
    })
  }

  if (stressed.length > 0) {
    cards.push({
      kicker: 'Risk Watch',
      title: 'Immediate operator review required',
      summary: `${stressed.map((firm) => `${firm.name} (${firm.signalLabel})`).join(' · ')}`,
      tone: 'red',
      href: '/insights',
    })
  }

  return {
    insights: cards.slice(0, 4),
    rising,
    warnings,
    stressed,
  }
}

export function generateMarketInsights(firms: PublicFirmRecord[]): MarketInsight[] {
  return buildMarketInsightsReport(firms).insights
}
