import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { prisma } from '@/lib/prisma'
import { listExperiments } from '@/lib/autonomous-lab/registry'
import { listBacklog, listRecentUserFeedback } from '@/lib/autonomous-lab/hypothesis-generator'
import { rankBacklogForExecution } from '@/lib/autonomous-lab/priority-engine'
import { getRadarCycleSignals } from '@/lib/autonomous-lab/radar-bridge'
import { getLatestPriorityScores } from '@/lib/autonomous-lab/priority-history'
import { getDecisionPenaltyMap } from '@/lib/autonomous-lab/decision-memory'
import { getRuntimeControlState } from '@/lib/autonomous-lab/runtime-control'
import { runDecisionEngine } from '@/lib/autonomous-lab/decision-engine'
import {
  listDecisionSnapshots,
  recordDecisionSnapshot,
} from '@/lib/autonomous-lab/decision-history'

type RuntimeControlAuditEvent = {
  id: string
  action: string
  userId: string | null
  details: string | null
  createdAt: string
  success: boolean
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

function toFloat(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function toInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value || String(fallback), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function buildBaseUrl(request: NextRequest): string {
  const explicit = request.nextUrl.searchParams.get('baseUrl')
  if (explicit) return explicit

  const origin = request.headers.get('origin')
  if (origin) return origin

  const host = request.headers.get('host') || '127.0.0.1:3000'
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

function computeSystemLoad(input: {
  cpuUsagePct: number
  apiLatencyMs: number
  queueDepth: number
  latencySaturationMs: number
  queueDepthSaturation: number
}): {
  value: number
  components: { cpuUsage: number; apiLatency: number; queueDepth: number }
} {
  const cpuUsage = clamp(Number(input.cpuUsagePct || 0) / 100)
  const apiLatency = clamp(Number(input.apiLatencyMs || 0) / Math.max(1, input.latencySaturationMs))
  const queueDepth = clamp(Number(input.queueDepth || 0) / Math.max(1, input.queueDepthSaturation))

  return {
    value: Number((cpuUsage * 0.4 + apiLatency * 0.3 + queueDepth * 0.3).toFixed(4)),
    components: {
      cpuUsage: Number(cpuUsage.toFixed(4)),
      apiLatency: Number(apiLatency.toFixed(4)),
      queueDepth: Number(queueDepth.toFixed(4)),
    },
  }
}

function computeThreatLevel(summary: Record<string, unknown>): number {
  const dangerFirms = clamp(Number(summary?.dangerFirms || 0) / 10)
  const newAlerts = clamp(Number(summary?.newAlerts || 0) / 10)
  const suspiciousSignals = clamp(Number(summary?.suspiciousSignals || 0) / 25)
  return Number((dangerFirms * 0.5 + newAlerts * 0.3 + suspiciousSignals * 0.2).toFixed(4))
}

function computeRecentSuccessRate(experiments: Array<{ status?: string }>): {
  decided: number
  approved: number
  rejected: number
  successRate: number
  approvalRatePct: number
} {
  let approved = 0
  let rejected = 0

  for (const exp of experiments) {
    const status = String(exp?.status || '').toLowerCase()
    if (status === 'approved' || status === 'review_required') approved += 1
    if (status === 'rejected') rejected += 1
  }

  const decided = approved + rejected
  const successRate = decided > 0 ? approved / decided : 0.5
  const approvalRatePct = decided > 0 ? (approved / decided) * 100 : 50

  return {
    decided,
    approved,
    rejected,
    successRate: Number(successRate.toFixed(4)),
    approvalRatePct: Number(approvalRatePct.toFixed(2)),
  }
}

function classifyCycleType(input: {
  recentSuccessRate: number
  recoverySuccessThreshold: number
  threatLevel: number
  priorityPressure: number
}): 'exploration' | 'exploitation' | 'recovery' {
  if (input.recentSuccessRate < input.recoverySuccessThreshold) return 'recovery'
  if (input.threatLevel > 0.65 || input.priorityPressure > 0.65) return 'exploitation'
  return 'exploration'
}

function computeDynamicPriorityThreshold(input: {
  baseThreshold: number
  systemLoad: number
  recentSuccessRate: number
}): number {
  const threshold =
    input.baseThreshold * (1 + input.systemLoad) * (1 - clamp(input.recentSuccessRate))
  return Number(clamp(threshold, 0.5, 9.5).toFixed(4))
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const search = request.nextUrl.searchParams
  const baseThreshold = toFloat(search.get('baseThreshold'), 4.5, 0.5, 10)
  const recoverySuccessThreshold = toFloat(search.get('recoverySuccessThreshold'), 0.25, 0, 1)
  const qualityStopMinApprovalRate = toFloat(search.get('qualityStopMinApprovalRate'), 20, 0, 100)
  const qualityStopMinSamples = toInt(search.get('qualityStopMinSamples'), 12, 1, 500)
  const latencySaturationMs = toInt(search.get('latencySaturationMs'), 2000, 100, 120000)
  const queueDepthSaturation = toInt(search.get('queueDepthSaturation'), 20, 1, 5000)

  const manualRadarBoostModules = String(
    search.get('radarBoostModules') || 'scoring,pipeline,operator'
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  const startedAt = Date.now()
  const baseUrl = buildBaseUrl(request)

  const [healthResult, radarSignals, experiments, backlog, feedback, runtimeControl, decisionState] = await Promise.all([
    (async () => {
      const start = Date.now()
      let apiLatency = 0
      try {
        await prisma.$queryRaw`SELECT 1`
        apiLatency = Date.now() - start
      } catch {
        apiLatency = Date.now() - start
      }

      const load1m = os.loadavg()[0]
      const cpuCount = os.cpus().length || 1
      const cpuUsage = Math.min(100, Math.max(0, Math.round((load1m / cpuCount) * 100)))

      return {
        cpuUsage,
        apiLatency,
      }
    })(),
    getRadarCycleSignals(baseUrl),
    listExperiments(140),
    listBacklog(undefined, 500),
    listRecentUserFeedback(500),
    getRuntimeControlState(),
    runDecisionEngine(baseUrl).catch(() => null),
  ])

  const runtimeControlAuditRows = await prisma.adminAuditTrail.findMany({
    where: {
      action: 'autonomous_runtime_control_mode_change',
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true,
      action: true,
      userId: true,
      details: true,
      createdAt: true,
      success: true,
    },
  })

  const runtimeControlAuditTrail: RuntimeControlAuditEvent[] = runtimeControlAuditRows.map((row) => ({
    id: row.id,
    action: row.action,
    userId: row.userId,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
    success: row.success,
  }))

  const queueDepth = await prisma.adminJobs.count({
    where: {
      status: {
        in: ['queued', 'running', 'pending'],
      },
    },
  })

  const backlogPool = backlog.filter((x) => x.status === 'pending')
  const previousScores = await getLatestPriorityScores(backlogPool.map((x) => x.id))
  const decisionPenaltyByKey = await getDecisionPenaltyMap(
    backlogPool.map((x) => ({ module: x.module, hypothesis: x.hypothesis }))
  )

  const radarBoostModules = [
    ...new Set([...manualRadarBoostModules, ...radarSignals.boostModules]),
  ]

  const ranked = rankBacklogForExecution(backlogPool, {
    recentFeedback: feedback,
    radarBoostModules,
    radarPriorityOverrides: radarSignals.priorityOverrides,
    previousScores,
    decisionPenaltyByKey,
  })

  const topPriorityScore = ranked[0]?.dynamicPriorityScore || 0
  const priorityPressure = Number(clamp(topPriorityScore / 10).toFixed(4))

  const quality = computeRecentSuccessRate(experiments)
  const threatLevel = computeThreatLevel(radarSignals.summary as Record<string, unknown>)
  const systemLoadComputed = computeSystemLoad({
    cpuUsagePct: healthResult.cpuUsage,
    apiLatencyMs: healthResult.apiLatency,
    queueDepth,
    latencySaturationMs,
    queueDepthSaturation,
  })

  const dynamicThreshold = computeDynamicPriorityThreshold({
    baseThreshold,
    systemLoad: systemLoadComputed.value,
    recentSuccessRate: quality.successRate,
  })

  const cycleType = classifyCycleType({
    recentSuccessRate: quality.successRate,
    recoverySuccessThreshold,
    threatLevel,
    priorityPressure,
  })

  const qualityStopActive =
    quality.decided >= qualityStopMinSamples &&
    quality.approvalRatePct < qualityStopMinApprovalRate

  const elapsedMs = Date.now() - startedAt

  if (decisionState) {
    await recordDecisionSnapshot({
      source: 'supervision',
      decision: decisionState,
      dedupeWindowSeconds: 120,
      metadata: {
        route: '/api/admin/autonomous-lab/supervision',
        cycleType,
        qualityStopActive,
      },
    }).catch(() => null)
  }

  const recentDecisionHistory = await listDecisionSnapshots({ limit: 10 }).catch(() => [])

  return NextResponse.json({
    success: true,
    data: {
      systemLoad: systemLoadComputed.value,
      threatLevel,
      cycleType,
      dynamicThreshold,
      qualityStop: {
        active: qualityStopActive,
        approvalRatePct: quality.approvalRatePct,
        decidedSamples: quality.decided,
        minApprovalRatePct: qualityStopMinApprovalRate,
        minSamples: qualityStopMinSamples,
        reason: qualityStopActive
          ? 'recent approval rate below configured quality floor'
          : 'quality floor respected',
      },
      telemetry: {
        systemLoadComponents: systemLoadComputed.components,
        queueDepth,
        apiLatencyMs: healthResult.apiLatency,
        cpuUsagePct: healthResult.cpuUsage,
        priorityPressure,
        topPriorityScore: Number(topPriorityScore.toFixed(4)),
        recentSuccessRate: quality.successRate,
      },
      runtimeControl: {
        ...runtimeControl,
        auditTrail: runtimeControlAuditTrail,
      },
      decisionEngine: decisionState,
      decisionHistory: recentDecisionHistory,
      radar: {
        summary: radarSignals.summary,
        boostModules: radarBoostModules,
        priorityOverrides: radarSignals.priorityOverrides,
      },
      config: {
        baseThreshold,
        recoverySuccessThreshold,
        latencySaturationMs,
        queueDepthSaturation,
      },
      measuredAt: new Date().toISOString(),
      computeLatencyMs: elapsedMs,
    },
  })
}
