/**
 * POST /api/admin/autonomous-lab/simulate
 * ─────────────────────────────────────────
 * "What if" scenario simulator for the Decision Engine.
 * Accepts partial signal overrides and returns what the engine would decide.
 *
 * Body (all optional):
 *   systemLoad         0–100
 *   threatLevel        0–100
 *   cycleType          'scheduled'|'radar_triggered'|'feedback_triggered'|'manual'|'idle'
 *   priorityPressure   0–10
 *   recentSuccessRate  0–1
 *   totalRadarEvents   integer
 *   negativeFeedbackCount integer
 *   metaLearningRate   0–1
 *   approvalTrend      'uptrend'|'stable'|'downtrend'
 *   runtimeMode        'auto'|'fast'|'safe'  (optional override)
 *
 * Returns { success, scenario, decision, diff }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import {
  computeDecision,
  gatherDecisionSignals,
  runDecisionEngine,
  type DecisionSignals,
  type CycleType,
} from '@/lib/autonomous-lab/decision-engine'
import { getRuntimeControlState } from '@/lib/autonomous-lab/runtime-control'
import { recordDecisionSnapshot } from '@/lib/autonomous-lab/decision-history'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampNum(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  if (isNaN(n)) return undefined
  return Math.max(min, Math.min(max, n))
}

function parseCycleType(value: unknown): CycleType | undefined {
  const valid: CycleType[] = [
    'scheduled',
    'radar_triggered',
    'feedback_triggered',
    'manual',
    'idle',
  ]
  if (typeof value === 'string' && valid.includes(value as CycleType)) {
    return value as CycleType
  }
  return undefined
}

function parseApprovalTrend(
  value: unknown,
): 'uptrend' | 'stable' | 'downtrend' | undefined {
  if (value === 'uptrend' || value === 'stable' || value === 'downtrend') {
    return value
  }
  return undefined
}

function parseRuntimeMode(value: unknown): 'auto' | 'fast' | 'safe' | undefined {
  if (value === 'auto' || value === 'fast' || value === 'safe') return value
  return undefined
}

// Simple diff: fields where scenario differs from baseline
function diffDecision(
  baseline: Record<string, unknown>,
  scenario: Record<string, unknown>,
): Record<string, { baseline: unknown; scenario: unknown }> {
  const diff: Record<string, { baseline: unknown; scenario: unknown }> = {}
  const keys = new Set([...Object.keys(baseline), ...Object.keys(scenario)])
  for (const key of keys) {
    if (key === 'computedAt' || key === 'signalsSnapshot' || key === 'reasoning') continue
    const bVal = JSON.stringify(baseline[key])
    const sVal = JSON.stringify(scenario[key])
    if (bVal !== sVal) {
      diff[key] = { baseline: baseline[key], scenario: scenario[key] }
    }
  }
  return diff
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const baseUrl =
    request.headers.get('origin') ||
    process.env.NEXTAUTH_URL ||
    'http://127.0.0.1:3000'

  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) ?? {}
  } catch {
    /* empty body is fine */
  }

  // Parse scenario overrides from body
  const signalOverrides: Partial<DecisionSignals> = {}
  const sl = clampNum(body.systemLoad, 0, 100)
  if (sl !== undefined) signalOverrides.systemLoad = sl

  const tl = clampNum(body.threatLevel, 0, 100)
  if (tl !== undefined) signalOverrides.threatLevel = tl

  const ct = parseCycleType(body.cycleType)
  if (ct !== undefined) signalOverrides.cycleType = ct

  const pp = clampNum(body.priorityPressure, 0, 10)
  if (pp !== undefined) signalOverrides.priorityPressure = pp

  const sr = clampNum(body.recentSuccessRate, 0, 1)
  if (sr !== undefined) signalOverrides.recentSuccessRate = sr

  const tre = clampNum(body.totalRadarEvents, 0, 10000)
  if (tre !== undefined) signalOverrides.totalRadarEvents = tre

  const nfc = clampNum(body.negativeFeedbackCount, 0, 10000)
  if (nfc !== undefined) signalOverrides.negativeFeedbackCount = nfc

  const mlr = clampNum(body.metaLearningRate, 0, 1)
  if (mlr !== undefined) signalOverrides.metaLearningRate = mlr

  const at = parseApprovalTrend(body.approvalTrend)
  if (at !== undefined) signalOverrides.approvalTrend = at

  const runtimeOverride = parseRuntimeMode(body.runtimeMode)

  try {
    // Compute BASELINE (current live state) and SCENARIO in parallel
    const [baseline, scenarioSignals, runtimeState] = await Promise.all([
      runDecisionEngine(baseUrl),
      gatherDecisionSignals(baseUrl, signalOverrides),
      getRuntimeControlState().catch(() => ({ mode: 'auto' as const, updatedAt: '' })),
    ])

    const effectiveMode = runtimeOverride ?? runtimeState.mode
    const scenarioDecision = computeDecision(scenarioSignals, effectiveMode)

    await Promise.allSettled([
      recordDecisionSnapshot({
        source: 'simulate_baseline',
        decision: baseline,
        dedupeWindowSeconds: 180,
        metadata: {
          route: '/api/admin/autonomous-lab/simulate',
        },
      }),
      recordDecisionSnapshot({
        source: 'simulate_scenario',
        decision: scenarioDecision,
        dedupeWindowSeconds: 180,
        metadata: {
          route: '/api/admin/autonomous-lab/simulate',
          hasRuntimeOverride: Boolean(runtimeOverride),
          overrideKeys: Object.keys(signalOverrides),
        },
      }),
    ])

    const diff = diffDecision(
      baseline as unknown as Record<string, unknown>,
      scenarioDecision as unknown as Record<string, unknown>,
    )

    return NextResponse.json({
      success: true,
      scenario: {
        overrides: signalOverrides,
        runtimeModeOverride: runtimeOverride ?? null,
      },
      baseline,
      decision: scenarioDecision,
      diff,
      hasDiff: Object.keys(diff).length > 0,
    })
  } catch (error) {
    console.error('[simulate/route] error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
  }
}
