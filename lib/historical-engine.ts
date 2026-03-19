import type { PublicFirmRecord } from './public-firms'
import { computeFirmSignal } from './signal-engine'
import { detectEarlyWarning } from './risk-engine'

type ScorePoint = {
  date: string
  score: number
}

type ScoreEvent = {
  date: string
  label: string
  impact?: number
}

export type HistoricalReplay = {
  points: ScorePoint[]
  events: ScoreEvent[]
  summary: string
  methodologyNote: string
}

function clampScore(value: number): number {
  return Math.max(10, Math.min(98, Math.round(value * 10) / 10))
}

function getQuarterLabels(baseDate = new Date()): string[] {
  const labels: string[] = []
  const year = baseDate.getUTCFullYear()
  const quarter = Math.floor(baseDate.getUTCMonth() / 3)

  for (let offset = 3; offset >= 0; offset -= 1) {
    const qIndex = quarter - offset
    const normalizedQuarter = ((qIndex % 4) + 4) % 4
    const qYear = year + Math.floor(qIndex / 4)
    labels.push(`Q${normalizedQuarter + 1} ${qYear}`)
  }

  return labels
}

export function buildHistoricalReplay(firm: PublicFirmRecord, baseDate = new Date()): HistoricalReplay {
  const signal = computeFirmSignal(firm)
  const earlyWarning = detectEarlyWarning(firm)
  const score = firm.score_0_100 ?? 0
  const labels = getQuarterLabels(baseDate)

  let series: number[]
  if (signal.type === 'rising') {
    series = [score - 12, score - 8, score - 4, score]
  } else if (signal.type === 'stable') {
    series = [score - 3.5, score - 2, score - 1, score]
  } else if (signal.type === 'high-risk') {
    series = [score + 11, score + 7, score + 4, score]
  } else if (signal.type === 'deteriorating') {
    series = [score + 18, score + 12, score + 6, score]
  } else {
    series = [score, score, score, score]
  }

  const points: ScorePoint[] = labels.map((label, index) => ({
    date: label,
    score: clampScore(series[index] ?? score),
  }))

  const events: ScoreEvent[] = []
  if (signal.type === 'rising') {
    events.push({ date: labels[1], label: 'Institutional pillars strengthened', impact: +4 })
    events.push({ date: labels[3], label: 'Current snapshot confirms rising posture', impact: +(points[3].score - points[2].score) })
  } else if (signal.type === 'stable') {
    events.push({ date: labels[1], label: 'Operating conditions remained controlled', impact: 0 })
    events.push({ date: labels[3], label: 'Current snapshot confirms stable posture', impact: +(points[3].score - points[2].score) })
  } else if (signal.type === 'high-risk' || signal.type === 'deteriorating') {
    events.push({ date: labels[1], label: 'Structural quality began to weaken', impact: -4 })
    events.push({ date: labels[2], label: 'Risk signal intensified into current posture', impact: -(points[2].score - points[3].score) })
  }

  if (earlyWarning) {
    events.push({ date: labels[3], label: `Early warning detected: ${earlyWarning.label}`, impact: signal.type === 'rising' ? 0 : -2 })
  }

  const first = points[0]?.score ?? score
  const last = points[points.length - 1]?.score ?? score
  const delta = Math.round((last - first) * 10) / 10
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`
  const summary = `${firm.name || firm.firm_id || 'This firm'} moved from ${first.toFixed(1)} to ${last.toFixed(1)} across the replay window (${deltaLabel}). Current posture: ${signal.label.toLowerCase()}.`

  return {
    points,
    events,
    summary,
    methodologyNote: 'Historical replay is inferred deterministically from the current validated snapshot, signal posture, and pillar dispersion. It is a modelled trajectory, not a claim of archived quarterly scores.',
  }
}
