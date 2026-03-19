/**
 * Autonomous Lab — Decision Engine (Level 7)
 * ──────────────────────────────────────────
 * Central decision brain: fuses all available signals from subsystems into
 * a unified, explainable decisional output.
 *
 * Inputs  : systemLoad, threatLevel, cycleType, priorityPressure,
 *           recentSuccessRate, radarSignals, feedbackSignals, metaLearning
 * Outputs : shouldRunCycle, cycleIntensity, moduleFocus, priorityOverrides,
 *           pacingMultiplier, riskLevel, reasoning, confidence
 */

import { getRuntimeControlState } from './runtime-control'
import { getRadarCycleSignals } from './radar-bridge'
import { listRecentUserFeedback } from './hypothesis-generator'
import { getLatestMetaSnapshot } from './meta-optimizer'
import type { LabModule } from './types'

// ─── Public types ─────────────────────────────────────────────────────────────

export type CycleIntensity = 'low' | 'normal' | 'burst'
export type RiskLevel = 'safe' | 'watch' | 'critical'
export type CycleType = 'scheduled' | 'radar_triggered' | 'feedback_triggered' | 'manual' | 'idle'

export interface DecisionSignals {
  /** 0–100: current system CPU/queue load estimate */
  systemLoad: number
  /** 0–100: radar threat level (danger firms, new alerts) */
  threatLevel: number
  /** What kind of cycle is being evaluated */
  cycleType?: CycleType
  /** 0–10: how urgent the backlog is (ranked priority score) */
  priorityPressure: number
  /** 0–1: ratio of approved experiments in last N cycles */
  recentSuccessRate: number
  /** Override: total radar events (newAlerts + dangerFirms) */
  totalRadarEvents?: number
  /** Override: recent user negative feedback count */
  negativeFeedbackCount?: number
  /** Override: meta learning rate (from meta-optimizer) */
  metaLearningRate?: number
  /** Override: current approval trend */
  approvalTrend?: 'uptrend' | 'stable' | 'downtrend'
  /** Live radar signal payload used to justify priority focus */
  radarSignals?: {
    boostModules: LabModule[]
    priorityOverrides: Partial<Record<LabModule, number>>
    summary: {
      totalEvents: number
      newAlerts: number
      dangerFirms: number
      suspiciousSignals: number
    }
  }
  /** Live user feedback signal payload */
  feedbackSignals?: {
    total: number
    negativeCount: number
    suspiciousCount: number
    rankingBadCount: number
  }
  /** Meta-learning snapshot payload */
  metaLearning?: {
    learningRate: number
    approvalTrend: 'uptrend' | 'stable' | 'downtrend'
    improvementOverTime: number
  }
  /** Live Globe/WebGL telemetry signal payload */
  webglSignals?: {
    avgFps: number
    avgFrameTime: number
    criticalCount: number
    warningCount: number
    topGpuTier: string
    topDevice: string
    sampleSize: number
    lastEventAgeSec: number | null
  }
}

export interface DecisionOutput {
  shouldRunCycle: boolean
  cycleIntensity: CycleIntensity
  moduleFocus: LabModule[]
  priorityOverrides: Partial<Record<LabModule, number>>
  pacingMultiplier: number
  riskLevel: RiskLevel
  reasoning: string[]
  confidence: number
  computedAt: string
  runtimeMode: string
  signalsSnapshot: DecisionSignals
}

type WebglTelemetryPayload = {
  events?: Array<{ ts?: number }>
  summary?: {
    avgFps?: number
    avgFrameTime?: number
    criticalCount?: number
    warningCount?: number
    topGpuTier?: string
    topDevice?: string
  }
}

async function getWebglDecisionSignals(baseUrl: string): Promise<NonNullable<DecisionSignals['webglSignals']>> {
  const fallback: NonNullable<DecisionSignals['webglSignals']> = {
    avgFps: 0,
    avgFrameTime: 0,
    criticalCount: 0,
    warningCount: 0,
    topGpuTier: 'unknown',
    topDevice: 'unknown',
    sampleSize: 0,
    lastEventAgeSec: null,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3_000)
  try {
    const response = await fetch(`${baseUrl}/api/telemetry/webgl?limit=300&maxAgeSec=900`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) return fallback

    const payload = (await response.json()) as WebglTelemetryPayload
    const summary = payload?.summary || {}
    const events = Array.isArray(payload?.events) ? payload.events : []
    const lastEventTs = Number(events[events.length - 1]?.ts || 0)
    const lastEventAgeSec = lastEventTs > 0
      ? Math.max(0, Math.round((Date.now() - lastEventTs) / 1000))
      : null

    return {
      avgFps: Number(summary.avgFps || 0),
      avgFrameTime: Number(summary.avgFrameTime || 0),
      criticalCount: Number(summary.criticalCount || 0),
      warningCount: Number(summary.warningCount || 0),
      topGpuTier: String(summary.topGpuTier || 'unknown'),
      topDevice: String(summary.topDevice || 'unknown'),
      sampleSize: events.length,
      lastEventAgeSec,
    }
  } catch {
    return fallback
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Signal gathering ─────────────────────────────────────────────────────────

/**
 * Collect live signals from all subsystems (non-blocking, best-effort).
 * Returns a merged `DecisionSignals` object; partial override is allowed.
 */
export async function gatherDecisionSignals(
  baseUrl: string,
  overrides?: Partial<DecisionSignals>,
): Promise<DecisionSignals> {
  // Radar signals (best-effort, 5 s timeout)
  let threatLevel = overrides?.threatLevel ?? 0
  let totalRadarEvents = overrides?.totalRadarEvents ?? 0
  let radarSignalsPayload: DecisionSignals['radarSignals'] = {
    boostModules: [],
    priorityOverrides: {},
    summary: { totalEvents: 0, newAlerts: 0, dangerFirms: 0, suspiciousSignals: 0 },
  }

  const radarController = new AbortController()
  const radarTimeout = setTimeout(() => radarController.abort(), 5_000)
  try {
    const radarSignals = await getRadarCycleSignals(baseUrl, { signal: radarController.signal })

    const { newAlerts, dangerFirms, suspiciousSignals } = radarSignals.summary
    totalRadarEvents = overrides?.totalRadarEvents ?? (newAlerts + dangerFirms)
    threatLevel = overrides?.threatLevel ?? Math.min(
      100,
      Math.round(
        dangerFirms * 8 +
          newAlerts * 4 +
          suspiciousSignals * 0.5,
      ),
    )
    radarSignalsPayload = {
      boostModules: radarSignals.boostModules,
      priorityOverrides: radarSignals.priorityOverrides,
      summary: radarSignals.summary,
    }
  } catch {
    /* radar unavailable — continue with defaults */
  } finally {
    clearTimeout(radarTimeout)
  }

  // Feedback signals (best-effort)
  let negativeFeedbackCount = overrides?.negativeFeedbackCount ?? 0
  let feedbackSignalsPayload: DecisionSignals['feedbackSignals'] = {
    total: 0,
    negativeCount: 0,
    suspiciousCount: 0,
    rankingBadCount: 0,
  }
  try {
    const feedback = await listRecentUserFeedback(200)
    const negativeRows = feedback.filter(
        (f) =>
          f.feedbackType === 'ranking_bad' ||
          f.feedbackType === 'suspicious_firm' ||
          f.feedbackType === 'firm_overvalued' ||
          f.feedbackType === 'firm_undervalued',
      )
    const suspiciousCount = feedback.filter((f) => f.feedbackType === 'suspicious_firm').length
    const rankingBadCount = feedback.filter((f) => f.feedbackType === 'ranking_bad').length

    negativeFeedbackCount = overrides?.negativeFeedbackCount ?? negativeRows.length
    feedbackSignalsPayload = {
      total: feedback.length,
      negativeCount: negativeRows.length,
      suspiciousCount,
      rankingBadCount,
    }
  } catch {
    /* feedback unavailable */
  }

  // Meta-learning snapshot (best-effort)
  let metaLearningPayload: DecisionSignals['metaLearning'] = {
    learningRate: 0,
    approvalTrend: 'stable',
    improvementOverTime: 0,
  }
  try {
    const latestMeta = await getLatestMetaSnapshot()
    if (latestMeta) {
      metaLearningPayload = {
        learningRate: Number(latestMeta.learningRate || 0),
        approvalTrend: latestMeta.approvalTrend || 'stable',
        improvementOverTime: Number(latestMeta.improvementOverTime || 0),
      }
    }
  } catch {
    /* meta unavailable */
  }

  // WebGL/Globe telemetry signals (best-effort)
  const liveWebglSignals = await getWebglDecisionSignals(baseUrl)
  const webglSignals: NonNullable<DecisionSignals['webglSignals']> = overrides?.webglSignals
    ? {
        avgFps: Number(overrides.webglSignals.avgFps || 0),
        avgFrameTime: Number(overrides.webglSignals.avgFrameTime || 0),
        criticalCount: Number(overrides.webglSignals.criticalCount || 0),
        warningCount: Number(overrides.webglSignals.warningCount || 0),
        topGpuTier: String(overrides.webglSignals.topGpuTier || 'unknown'),
        topDevice: String(overrides.webglSignals.topDevice || 'unknown'),
        sampleSize: Number(overrides.webglSignals.sampleSize || 0),
        lastEventAgeSec:
          overrides.webglSignals.lastEventAgeSec == null
            ? null
            : Number(overrides.webglSignals.lastEventAgeSec),
      }
    : liveWebglSignals
  const webglStale = webglSignals.lastEventAgeSec !== null && webglSignals.lastEventAgeSec > 600
  const webglStress = Math.min(
    1,
    (webglSignals.avgFps > 0 && webglSignals.avgFps < 30 ? (30 - webglSignals.avgFps) / 30 : 0) +
    (webglSignals.avgFrameTime > 120 ? Math.min(1, (webglSignals.avgFrameTime - 120) / 120) : 0) +
    (webglSignals.criticalCount > 0 ? Math.min(1, webglSignals.criticalCount / 3) : 0)
  )

  // System load: approximate from env/runtime heuristics
  const systemLoad =
    overrides?.systemLoad ??
    Math.min(
      100,
      Math.round(totalRadarEvents * 2 + negativeFeedbackCount * 1.5 + webglStress * 15 + (webglStale ? 3 : 0))
    )

  // Priority pressure: scaled from radar + feedback combined
  const priorityPressure =
    overrides?.priorityPressure ??
    Math.min(
      10,
      Number(((threatLevel / 20) + (negativeFeedbackCount / 10) + webglStress * 2).toFixed(2))
    )

  const base: DecisionSignals = {
    systemLoad,
    threatLevel,
    cycleType: overrides?.cycleType ?? (totalRadarEvents > 0 ? 'radar_triggered' : 'scheduled'),
    priorityPressure,
    recentSuccessRate: overrides?.recentSuccessRate ?? 0.5,
    totalRadarEvents,
    negativeFeedbackCount,
    metaLearningRate: overrides?.metaLearningRate ?? metaLearningPayload.learningRate,
    approvalTrend: overrides?.approvalTrend ?? metaLearningPayload.approvalTrend,
    radarSignals: overrides?.radarSignals ?? radarSignalsPayload,
    feedbackSignals: overrides?.feedbackSignals ?? feedbackSignalsPayload,
    metaLearning: overrides?.metaLearning ?? metaLearningPayload,
    webglSignals,
  }

  // Apply remaining caller overrides (selective merge)
  return { ...base, ...overrides }
}

// ─── Core decision logic ──────────────────────────────────────────────────────

/**
 * Pure decision function — deterministic given the same signals.
 * No side effects, no async, safe to call in simulations.
 */
export function computeDecision(
  signals: DecisionSignals,
  runtimeMode: 'auto' | 'fast' | 'safe',
): DecisionOutput {
  const reasoning: string[] = []
  const {
    systemLoad,
    threatLevel,
    cycleType,
    priorityPressure,
    recentSuccessRate,
    totalRadarEvents = 0,
    negativeFeedbackCount = 0,
    metaLearningRate = 0,
    approvalTrend = 'stable',
    radarSignals,
    feedbackSignals,
    metaLearning,
    webglSignals,
  } = signals

  // ── 1. Risk level ──────────────────────────────────────────────────────────
  let riskLevel: RiskLevel = 'safe'
  if (threatLevel >= 60 || systemLoad >= 80) {
    riskLevel = 'critical'
    reasoning.push(`CRITICAL: threatLevel=${threatLevel}, systemLoad=${systemLoad}`)
  } else if (threatLevel >= 30 || systemLoad >= 50 || recentSuccessRate < 0.3) {
    riskLevel = 'watch'
    reasoning.push(`WATCH: threatLevel=${threatLevel}, successRate=${recentSuccessRate}`)
  } else {
    reasoning.push(`SAFE: nominal threat and load`)
  }

  if ((webglSignals?.criticalCount || 0) >= 2 || ((webglSignals?.avgFps || 0) > 0 && (webglSignals?.avgFps || 0) < 18)) {
    riskLevel = 'critical'
    reasoning.push(
      `CRITICAL: webgl criticalCount=${webglSignals?.criticalCount || 0}, avgFps=${webglSignals?.avgFps || 0}`,
    )
  } else if ((webglSignals?.warningCount || 0) >= 3 || ((webglSignals?.avgFrameTime || 0) > 120)) {
    if (riskLevel === 'safe') riskLevel = 'watch'
    reasoning.push(
      `WATCH: webgl warningCount=${webglSignals?.warningCount || 0}, avgFrameTime=${webglSignals?.avgFrameTime || 0}`,
    )
  }

  // Override from runtime control
  if (runtimeMode === 'safe') {
    riskLevel = 'critical' // force conservative path
    reasoning.push(`runtimeMode=safe → forced critical guard rails`)
  }

  // ── 2. Should run cycle ────────────────────────────────────────────────────
  let shouldRunCycle = false

  if (runtimeMode === 'safe') {
    shouldRunCycle = false
    reasoning.push(`runtimeMode=safe → cycle blocked`)
  } else if (runtimeMode === 'fast') {
    shouldRunCycle = true
    reasoning.push(`runtimeMode=fast → cycle forced`)
  } else {
    // auto: data-driven
    if (riskLevel === 'critical' && cycleType !== 'radar_triggered') {
      shouldRunCycle = false
      reasoning.push(`auto: critical risk + non-radar cycle → skip`)
    } else if (priorityPressure >= 5 || totalRadarEvents >= 5 || negativeFeedbackCount >= 10) {
      shouldRunCycle = true
      reasoning.push(
        `auto: high pressure (p=${priorityPressure}, radar=${totalRadarEvents}, fb=${negativeFeedbackCount}) → run`,
      )
    } else if ((webglSignals?.criticalCount || 0) > 0 || ((webglSignals?.avgFps || 0) > 0 && (webglSignals?.avgFps || 0) < 25)) {
      shouldRunCycle = true
      reasoning.push(
        `auto: webgl pressure (critical=${webglSignals?.criticalCount || 0}, fps=${webglSignals?.avgFps || 0}) → run`,
      )
    } else if (recentSuccessRate >= 0.6 && approvalTrend !== 'downtrend') {
      shouldRunCycle = true
      reasoning.push(`auto: healthy successRate (${recentSuccessRate}) + trend=${approvalTrend} → run`)
    } else if (cycleType === 'manual') {
      shouldRunCycle = true
      reasoning.push(`auto: manual trigger → run`)
    } else {
      reasoning.push(`auto: low signal pressure, no cycle needed`)
    }
  }

  // ── 3. Cycle intensity ─────────────────────────────────────────────────────
  let cycleIntensity: CycleIntensity = 'normal'

  if (!shouldRunCycle) {
    cycleIntensity = 'low'
  } else if (
    totalRadarEvents >= 10 ||
    threatLevel >= 50 ||
    (cycleType === 'radar_triggered' && negativeFeedbackCount >= 5) ||
    (webglSignals?.criticalCount || 0) > 0
  ) {
    cycleIntensity = 'burst'
    reasoning.push(`intensity=burst: radar surge (${totalRadarEvents} events)`)
  } else if (riskLevel === 'watch' || approvalTrend === 'downtrend') {
    cycleIntensity = 'low'
    reasoning.push(`intensity=low: watch/downtrend → conservative`)
  } else {
    reasoning.push(`intensity=normal`)
  }

  // Override from runtime
  if (runtimeMode === 'fast' && cycleIntensity !== 'burst') {
    cycleIntensity = 'burst'
    reasoning.push(`runtimeMode=fast → intensity elevated to burst`)
  }

  // ── 4. Module focus ────────────────────────────────────────────────────────
  const moduleFocus: LabModule[] = []
  const priorityOverrides: Partial<Record<LabModule, number>> = {}

  // Keep radar-driven focus from the raw radar bridge output.
  if (radarSignals?.boostModules?.length) {
    for (const moduleName of radarSignals.boostModules) {
      if (!moduleFocus.includes(moduleName)) {
        moduleFocus.push(moduleName)
      }
    }
  }

  if (radarSignals?.priorityOverrides) {
    for (const [moduleName, override] of Object.entries(radarSignals.priorityOverrides)) {
      const typedModule = moduleName as LabModule
      if (override !== undefined) {
        priorityOverrides[typedModule] = Math.max(
          Number(priorityOverrides[typedModule] || 0),
          Number(override),
        )
      }
    }
  }

  if (threatLevel >= 20 || totalRadarEvents >= 3) {
    moduleFocus.push('scoring')
    priorityOverrides.scoring = Math.min(4, 1 + threatLevel / 30)
    reasoning.push(`focus: scoring boosted (threat=${threatLevel})`)
  }
  if (negativeFeedbackCount >= 5) {
    moduleFocus.push('pipeline')
    priorityOverrides.pipeline = Math.min(4, 1 + negativeFeedbackCount / 15)
    reasoning.push(`focus: pipeline (negativeFeedback=${negativeFeedbackCount})`)
  }
  if (metaLearningRate > 0.05 || approvalTrend === 'uptrend') {
    moduleFocus.push('operator')
    priorityOverrides.operator = 1.5
    reasoning.push(`focus: operator (metaRate=${metaLearningRate}, trend=${approvalTrend})`)
  }
  if (
    (webglSignals?.criticalCount || 0) > 0 ||
    (webglSignals?.warningCount || 0) >= 2 ||
    ((webglSignals?.avgFps || 0) > 0 && (webglSignals?.avgFps || 0) < 30)
  ) {
    moduleFocus.push('webgl')
    const webglSeverity =
      (webglSignals?.criticalCount || 0) > 0
        ? 1
        : Math.min(1, Math.max(0, (30 - Number(webglSignals?.avgFps || 30)) / 30))
    priorityOverrides.webgl = Math.min(4, 1.2 + webglSeverity * 2)
    reasoning.push(
      `focus: webgl (fps=${webglSignals?.avgFps || 0}, critical=${webglSignals?.criticalCount || 0}, warnings=${webglSignals?.warningCount || 0})`,
    )
  }
  // Always include webgl if no other focus + safe
  if (moduleFocus.length === 0 || riskLevel === 'safe') {
    if (!moduleFocus.includes('webgl')) {
      moduleFocus.push('webgl')
    }
  }
  // Ensure at least one module
  if (moduleFocus.length === 0) {
    moduleFocus.push('scoring')
  }
  const uniqueModuleFocus = [...new Set(moduleFocus)] as LabModule[]

  // ── 5. Pacing multiplier ───────────────────────────────────────────────────
  let pacingMultiplier = 1.0

  if (cycleIntensity === 'burst') {
    pacingMultiplier = 2.0
  } else if (cycleIntensity === 'low') {
    pacingMultiplier = 0.5
  } else if (riskLevel === 'watch') {
    pacingMultiplier = 0.75
  }

  // Meta-learning feedback: if success rate is high, allow faster pacing
  if (recentSuccessRate >= 0.75 && approvalTrend === 'uptrend') {
    pacingMultiplier *= 1.25
    reasoning.push(`pacing boost: highSuccessRate + uptrend → ×1.25`)
  } else if (recentSuccessRate < 0.3) {
    pacingMultiplier *= 0.6
    reasoning.push(`pacing reduction: low successRate → ×0.6`)
  }

  if ((webglSignals?.criticalCount || 0) > 0 || ((webglSignals?.avgFps || 0) > 0 && (webglSignals?.avgFps || 0) < 25)) {
    pacingMultiplier *= 0.85
    reasoning.push(`pacing reduction: webgl pressure → ×0.85`)
  }

  pacingMultiplier = Math.round(pacingMultiplier * 100) / 100

  // ── 6. Confidence score ────────────────────────────────────────────────────
  // How confident the engine is in this decision (0–1)
  let confidence = 0.5
  if (totalRadarEvents > 0 || negativeFeedbackCount > 0) confidence += 0.2
  if (metaLearningRate > 0.01) confidence += 0.1
  if (approvalTrend !== 'stable') confidence += 0.1
  if (runtimeMode !== 'auto') confidence += 0.1
  if ((webglSignals?.sampleSize || 0) > 0) confidence += 0.05
  confidence = Math.min(1, Math.round(confidence * 100) / 100)

  if (feedbackSignals && feedbackSignals.total > 0) {
    reasoning.push(
      `feedback: total=${feedbackSignals.total}, negative=${feedbackSignals.negativeCount}, suspicious=${feedbackSignals.suspiciousCount}`,
    )
  }
  if (metaLearning) {
    reasoning.push(
      `meta: learningRate=${metaLearning.learningRate}, trend=${metaLearning.approvalTrend}, improvement=${metaLearning.improvementOverTime}`,
    )
  }
  if (radarSignals?.summary) {
    reasoning.push(
      `radar: events=${radarSignals.summary.totalEvents}, alerts=${radarSignals.summary.newAlerts}, danger=${radarSignals.summary.dangerFirms}`,
    )
  }
  if (webglSignals) {
    reasoning.push(
      `webgl: fps=${webglSignals.avgFps}, frame=${webglSignals.avgFrameTime}ms, critical=${webglSignals.criticalCount}, warnings=${webglSignals.warningCount}, ageSec=${webglSignals.lastEventAgeSec ?? 'n/a'}`,
    )
  }

  return {
    shouldRunCycle,
    cycleIntensity,
    moduleFocus: uniqueModuleFocus,
    priorityOverrides,
    pacingMultiplier,
    riskLevel,
    reasoning,
    confidence,
    computedAt: new Date().toISOString(),
    runtimeMode,
    signalsSnapshot: signals,
  }
}

// ─── Full pipeline (async) ────────────────────────────────────────────────────

/**
 * Gather live signals + compute decision in one call.
 * Use from API routes, scheduler, or Copilot context injection.
 */
export async function runDecisionEngine(
  baseUrl: string,
  overrides?: Partial<DecisionSignals>,
): Promise<DecisionOutput> {
  const [signals, runtimeState] = await Promise.all([
    gatherDecisionSignals(baseUrl, overrides),
    getRuntimeControlState().catch(() => ({ mode: 'auto' as const, updatedAt: new Date().toISOString() })),
  ])

  return computeDecision(signals, runtimeState.mode)
}
