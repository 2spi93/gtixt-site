import type { LabModule } from './types'
import type { PriorityHypothesisInput } from './hypothesis-generator'

interface RadarEvent {
  firm_id: string
  firm_name?: string
  collapse_probability?: number
  warning_signals?: string[]
  status?: string
  signal_count?: number
}

interface RadarResponse {
  success?: boolean
  data?: RadarEvent[]
  new_alerts?: RadarEvent[]
  high_risk_firms?: RadarEvent[]
}

export interface RadarCycleSignals {
  boostModules: LabModule[]
  priorityOverrides: Partial<Record<LabModule, number>>
  priorityHypotheses: PriorityHypothesisInput[]
  summary: {
    totalEvents: number
    newAlerts: number
    dangerFirms: number
    suspiciousSignals: number
  }
}

function uniqueModules(values: LabModule[]): LabModule[] {
  return [...new Set(values)]
}

function clampOverride(value: number): number {
  return Math.max(0, Math.min(4, Number(value.toFixed(4))))
}

export async function getRadarCycleSignals(
  baseUrl: string,
  options?: { signal?: AbortSignal },
): Promise<RadarCycleSignals> {
  try {
    const response = await fetch(
      `${baseUrl}/api/radar/early-warning?limit=25&days=7&minScore=45`,
      { cache: 'no-store', ...(options?.signal ? { signal: options.signal } : {}) }
    )

    if (!response.ok) {
      return {
        boostModules: [],
        priorityOverrides: {},
        priorityHypotheses: [],
        summary: { totalEvents: 0, newAlerts: 0, dangerFirms: 0, suspiciousSignals: 0 },
      }
    }

    const payload = (await response.json()) as RadarResponse
    const events = Array.isArray(payload.data) ? payload.data : []
    const newAlerts = Array.isArray(payload.new_alerts) ? payload.new_alerts : []
    const highRisk = Array.isArray(payload.high_risk_firms) ? payload.high_risk_firms : []

    const dangerFirms = events.filter((event) => String(event.status || '').toLowerCase() === 'danger')
    const suspiciousSignals = events.reduce(
      (acc, event) => acc + (Array.isArray(event.warning_signals) ? event.warning_signals.length : 0),
      0
    )

    const boostModules: LabModule[] = []
    const priorityOverrides: Partial<Record<LabModule, number>> = {}
    const priorityHypotheses: PriorityHypothesisInput[] = []

    if (events.length > 0) {
      boostModules.push('scoring')
      priorityOverrides.scoring = clampOverride(
        1 + Math.min(2, events.length / 10) + Math.min(1, suspiciousSignals / 30)
      )
    }

    if (newAlerts.length >= 3 || suspiciousSignals >= 10) {
      boostModules.push('pipeline')
      priorityOverrides.pipeline = clampOverride(
        0.8 + Math.min(2, newAlerts.length / 5) + Math.min(1.2, suspiciousSignals / 20)
      )
    }

    if (dangerFirms.length >= 4) {
      boostModules.push('operator')
      priorityOverrides.operator = clampOverride(1.2 + Math.min(2.8, dangerFirms.length / 2))
    }

    if (events.length > 0) {
      priorityHypotheses.push({
        module: 'scoring',
        hypothesis:
          'Ajuster le scoring pour pénaliser plus vite les firmes avec signaux radar critiques récents',
        suggestedChanges: ['radar_penalty_weight_v1', 'early_warning_boost_v1'],
        rationale:
          'Le radar détecte des firmes à risque élevé. Le scoring doit réagir plus vite aux signaux critiques et suspicious.',
        impactScore: 9,
        confidenceScore: Math.min(9, 6 + Math.floor(events.length / 4)),
        costScore: 3,
        priority: 'critical',
        signalSummary: {
          source: 'radar',
          totalEvents: events.length,
          dangerFirms: dangerFirms.length,
          suspiciousSignals,
        },
      })
    }

    if (newAlerts.length >= 3) {
      priorityHypotheses.push({
        module: 'pipeline',
        hypothesis:
          'Réduire la latence d’ingestion des alertes radar pour accélérer la propagation des signaux critiques',
        suggestedChanges: ['radar_ingestion_priority_v1', 'early_warning_refresh_15m'],
        rationale:
          'Le volume de nouvelles alertes radar justifie une expérimentation sur la rapidité de propagation vers les modules de scoring.',
        impactScore: 8,
        confidenceScore: Math.min(8.5, 5 + newAlerts.length * 0.5),
        costScore: 4,
        priority: 'high',
        signalSummary: {
          source: 'radar',
          totalEvents: events.length,
          newAlerts: newAlerts.length,
        },
      })
    }

    if (dangerFirms.length >= 4) {
      priorityHypotheses.push({
        module: 'operator',
        hypothesis:
          'Escalader automatiquement les firmes Danger du radar vers une revue opérateur prioritaire',
        suggestedChanges: ['operator_radar_escalation_v1', 'danger_queue_priority'],
        rationale:
          'Un nombre élevé de firmes Danger justifie une expérience d’escalade opérateur plus agressive.',
        impactScore: 7.5,
        confidenceScore: Math.min(8, 5 + dangerFirms.length * 0.3),
        costScore: 3.5,
        priority: 'high',
        signalSummary: {
          source: 'radar',
          dangerFirms: dangerFirms.length,
          topDangerFirm: highRisk[0]?.firm_id || null,
        },
      })
    }

    return {
      boostModules: uniqueModules(boostModules),
      priorityOverrides,
      priorityHypotheses,
      summary: {
        totalEvents: events.length,
        newAlerts: newAlerts.length,
        dangerFirms: dangerFirms.length,
        suspiciousSignals,
      },
    }
  } catch {
    return {
      boostModules: [],
      priorityOverrides: {},
      priorityHypotheses: [],
      summary: { totalEvents: 0, newAlerts: 0, dangerFirms: 0, suspiciousSignals: 0 },
    }
  }
}
