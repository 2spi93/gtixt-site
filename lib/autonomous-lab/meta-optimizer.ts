/**
 * Autonomous Lab — Meta Optimizer
 * Learns from approved/rejected experiments to derive parameter adjustments
 * and produce closed-loop improvement insights.
 */
import { prisma } from '@/lib/prisma'

export interface MetaSnapshot {
  id: string
  computedAt: string
  totalApproved: number
  totalRejected: number
  approvalRate: number
  avgMetrics: Record<string, number>
  insights: string[]
  suggestedBiasAdjustment: number
  suggestedPenaltyAdjustment: number
  suggestedThresholdAdjustments: Record<string, Record<string, number>>
  learningRate: number
  improvementOverTime: number
  approvalTrend: 'uptrend' | 'stable' | 'downtrend'
  crossModuleCorrelations: Record<string, number | null>
  crossModuleInsights: string[]
}

// ─── DB setup ─────────────────────────────────────────────────────────────────
async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_meta_snapshots (
      id TEXT PRIMARY KEY,
      computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      total_approved INTEGER NOT NULL DEFAULT 0,
      total_rejected INTEGER NOT NULL DEFAULT 0,
      avg_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
      insights JSONB NOT NULL DEFAULT '[]'::jsonb,
      suggested_bias_adjustment DOUBLE PRECISION NOT NULL DEFAULT 0,
      suggested_penalty_adjustment DOUBLE PRECISION NOT NULL DEFAULT 0,
      suggested_threshold_adjustments JSONB NOT NULL DEFAULT '{}'::jsonb,
      learning_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      improvement_over_time DOUBLE PRECISION NOT NULL DEFAULT 0,
      approval_trend TEXT NOT NULL DEFAULT 'stable',
      cross_module_correlations JSONB NOT NULL DEFAULT '{}'::jsonb,
      cross_module_insights JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE autonomous_meta_snapshots
      ADD COLUMN IF NOT EXISTS learning_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS improvement_over_time DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS approval_trend TEXT NOT NULL DEFAULT 'stable',
      ADD COLUMN IF NOT EXISTS cross_module_correlations JSONB NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS cross_module_insights JSONB NOT NULL DEFAULT '[]'::jsonb
  `)
}

function pearsonCorrelation(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null
  const n = a.length
  const meanA = a.reduce((s, x) => s + x, 0) / n
  const meanB = b.reduce((s, x) => s + x, 0) / n

  let num = 0
  let denA = 0
  let denB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num += da * db
    denA += da * da
    denB += db * db
  }

  const den = Math.sqrt(denA * denB)
  if (den === 0) return null
  return Number((num / den).toFixed(4))
}

function moduleCompositeScore(module: string, metrics: Record<string, number>): number {
  const m = metrics ?? {}
  if (module === 'scoring') {
    return Number((
      50 +
      Number(m.decisionScore ?? 0) * 0.5 +
      Number(m.stabilityDelta ?? 0) * 5 +
      Number(m.anomaliesDelta ?? 0) * 3 +
      Number(m.coverageDelta ?? 0) * 2
    ).toFixed(2))
  }
  if (module === 'webgl') {
    return Number((
      50 +
      Number(m.perfDelta ?? 0) * 1.1 +
      Number(m.qualityDelta ?? 0) * 5
    ).toFixed(2))
  }
  if (module === 'pipeline') {
    return Number((
      50 +
      Number(m.stabilityDelta ?? 0) * 4 +
      Number(m.snapshotDriftDelta ?? 0) * 3 +
      Number(m.bucketChurnDelta ?? 0) * 2
    ).toFixed(2))
  }
  return Number((
    50 +
    Number(m.stabilityDelta ?? 0) * 3 +
    Number(m.qualityDelta ?? 0) * 3
  ).toFixed(2))
}

function normalize(row: Record<string, unknown>): MetaSnapshot {
  const approved = Number(row.total_approved ?? 0)
  const rejected = Number(row.total_rejected ?? 0)
  const total = approved + rejected

  return {
    id: String(row.id),
    computedAt:
      row.computed_at instanceof Date
        ? row.computed_at.toISOString()
        : String(row.computed_at),
    totalApproved: approved,
    totalRejected: rejected,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    avgMetrics:
      typeof row.avg_metrics === 'object' && row.avg_metrics !== null
        ? (row.avg_metrics as Record<string, number>)
        : {},
    insights: Array.isArray(row.insights)
      ? (row.insights as string[])
      : [],
    suggestedBiasAdjustment: Number(row.suggested_bias_adjustment ?? 0),
    suggestedPenaltyAdjustment: Number(row.suggested_penalty_adjustment ?? 0),
    suggestedThresholdAdjustments:
      typeof row.suggested_threshold_adjustments === 'object' &&
      row.suggested_threshold_adjustments !== null
        ? (row.suggested_threshold_adjustments as Record<string, Record<string, number>>)
        : {},
    learningRate: Number(row.learning_rate ?? 0),
    improvementOverTime: Number(row.improvement_over_time ?? 0),
    approvalTrend:
      String(row.approval_trend ?? 'stable') === 'uptrend'
        ? 'uptrend'
        : String(row.approval_trend ?? 'stable') === 'downtrend'
          ? 'downtrend'
          : 'stable',
    crossModuleCorrelations:
      typeof row.cross_module_correlations === 'object' && row.cross_module_correlations !== null
        ? (row.cross_module_correlations as Record<string, number | null>)
        : {},
    crossModuleInsights: Array.isArray(row.cross_module_insights)
      ? (row.cross_module_insights as string[])
      : [],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function runMetaOptimization(): Promise<MetaSnapshot> {
  await ensureSchema()

  const METRIC_KEYS = [
    'coverageDelta',
    'stabilityDelta',
    'anomaliesDelta',
    'riskSeparationDelta',
    'snapshotDriftDelta',
    'bucketChurnDelta',
    'decisionScore',
  ]

  const approved = await prisma.$queryRawUnsafe<
    Array<{ module: string; metrics: Record<string, number> }>
  >(
    `SELECT module, metrics FROM autonomous_experiments
     WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 50`
  )
  const rejected = await prisma.$queryRawUnsafe<
    Array<{ module: string; metrics: Record<string, number> }>
  >(
    `SELECT module, metrics FROM autonomous_experiments
     WHERE status = 'rejected' ORDER BY updated_at DESC LIMIT 50`
  )

  const recentAll = await prisma.$queryRawUnsafe<
    Array<{ module: string; metrics: Record<string, number>; updated_at: string }>
  >(
    `SELECT module, metrics, updated_at FROM autonomous_experiments
     WHERE status IN ('approved', 'rejected', 'review_required', 'tested')
     ORDER BY updated_at DESC LIMIT 240`
  )

  const totalApproved = approved.length
  const totalRejected = rejected.length
  const total = totalApproved + totalRejected

  // Compute average metrics for approved experiments
  const avgMetrics: Record<string, number> = {}
  for (const key of METRIC_KEYS) {
    const vals = approved
      .map((e) => Number((e.metrics as Record<string, number>)?.[key] ?? 0))
      .filter((v) => !isNaN(v))
    avgMetrics[key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  const insights: string[] = []
  const crossModuleInsights: string[] = []
  const suggestedThresholds: Record<string, Record<string, number>> = {}

  // ── Insight: Rejection rate ──────────────────────────────────────────────────
  if (total > 3) {
    const rejRate = totalRejected / total
    if (rejRate > 0.7) {
      insights.push(
        `⚠️ Taux de rejet élevé (${Math.round(rejRate * 100)}%). Les hypothèses actuelles sont trop agressives. Réduire candidateBias est recommandé.`
      )
    } else if (rejRate < 0.15 && total > 10) {
      insights.push(
        `📈 Taux d'approbation très élevé (${Math.round((1 - rejRate) * 100)}%). Les seuils sont peut-être trop permissifs. Envisager de relever minDecisionScore.`
      )
    } else {
      insights.push(
        `✅ Taux d'approbation: ${Math.round((1 - rejRate) * 100)}% (${totalApproved}/${total} expériences). Équilibre sain.`
      )
    }
  } else {
    insights.push(
      '📊 Pas encore assez d\'expériences complétées pour dériver des insights statistiques. Continuer les expériences (minimum 4 recommandé).'
    )
  }

  // ── Insight: Coverage ────────────────────────────────────────────────────────
  if (totalApproved > 2 && avgMetrics.coverageDelta > 1) {
    insights.push(
      `📊 Les expériences approuvées ont en moyenne un gain de couverture de +${avgMetrics.coverageDelta.toFixed(2)} points. Le seuil minCoverageDelta pourrait être relevé.`
    )
    suggestedThresholds['scoring'] = {
      ...(suggestedThresholds['scoring'] ?? {}),
      minCoverageDelta: Math.max(0.5, Math.floor(avgMetrics.coverageDelta * 0.5)),
    }
  }

  // ── Insight: Stability ───────────────────────────────────────────────────────
  if (totalApproved > 2 && avgMetrics.stabilityDelta > 0.5) {
    insights.push(
      `🔒 Stabilité moyenne des expériences approuvées: +${avgMetrics.stabilityDelta.toFixed(2)}. Le seuil de stabilité pourrait être relevé.`
    )
    suggestedThresholds['scoring'] = {
      ...(suggestedThresholds['scoring'] ?? {}),
      minStabilityDelta: Math.max(0.1, +(avgMetrics.stabilityDelta * 0.3).toFixed(2)),
    }
  }

  // ── Insight: Decision score ──────────────────────────────────────────────────
  if (totalApproved > 2 && avgMetrics.decisionScore > 0) {
    insights.push(
      `🎯 Score composite moyen des expériences approuvées: ${avgMetrics.decisionScore.toFixed(1)}/100. Valeur de référence actuelle.`
    )
  }

  // ── Cross-module learning layer (scoring/webgl/pipeline correlations) ─────
  const byDayModule: Record<string, Record<string, number[]>> = {}
  for (const exp of recentAll) {
    const day = String(exp.updated_at).slice(0, 10)
    if (!byDayModule[day]) byDayModule[day] = {}
    if (!byDayModule[day][exp.module]) byDayModule[day][exp.module] = []
    byDayModule[day][exp.module].push(moduleCompositeScore(exp.module, exp.metrics ?? {}))
  }

  const dayAverages: Record<string, Record<string, number>> = {}
  for (const [day, modules] of Object.entries(byDayModule)) {
    dayAverages[day] = {}
    for (const [module, values] of Object.entries(modules)) {
      const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)
      dayAverages[day][module] = Number(avg.toFixed(3))
    }
  }

  function pairedSeries(aModule: string, bModule: string): { a: number[]; b: number[] } {
    const sortedDays = Object.keys(dayAverages).sort()
    const a: number[] = []
    const b: number[] = []
    for (const d of sortedDays) {
      const av = dayAverages[d]?.[aModule]
      const bv = dayAverages[d]?.[bModule]
      if (typeof av === 'number' && typeof bv === 'number') {
        a.push(av)
        b.push(bv)
      }
    }
    return { a, b }
  }

  const sp = pairedSeries('scoring', 'pipeline')
  const sw = pairedSeries('scoring', 'webgl')
  const pw = pairedSeries('pipeline', 'webgl')

  const corrScoringPipeline = pearsonCorrelation(sp.a, sp.b)
  const corrScoringWebgl = pearsonCorrelation(sw.a, sw.b)
  const corrPipelineWebgl = pearsonCorrelation(pw.a, pw.b)

  const crossModuleCorrelations: Record<string, number | null> = {
    'scoring-pipeline': corrScoringPipeline,
    'scoring-webgl': corrScoringWebgl,
    'pipeline-webgl': corrPipelineWebgl,
  }

  const correlationSummary = [
    { key: 'scoring-pipeline', value: corrScoringPipeline },
    { key: 'scoring-webgl', value: corrScoringWebgl },
    { key: 'pipeline-webgl', value: corrPipelineWebgl },
  ]

  for (const item of correlationSummary) {
    if (item.value == null) {
      crossModuleInsights.push(`ℹ️ Corrélation ${item.key}: données insuffisantes (minimum 3 jours d'overlap).`)
      continue
    }
    if (item.value >= 0.45) {
      crossModuleInsights.push(`🔗 Corrélation positive ${item.key}: r=${item.value.toFixed(2)}. Les modules progressent ensemble.`)
    } else if (item.value <= -0.35) {
      crossModuleInsights.push(`⚠️ Corrélation négative ${item.key}: r=${item.value.toFixed(2)}. Une amélioration module peut dégrader un autre module.`)
    } else {
      crossModuleInsights.push(`➖ Corrélation faible ${item.key}: r=${item.value.toFixed(2)}. Peu d'interdépendance détectée.`)
    }
  }

  const approvalRate = total > 0 ? (totalApproved / total) * 100 : 0
  const learningRate = Number((approvalRate * 0.6 + Number(avgMetrics.decisionScore ?? 0) * 0.4).toFixed(2))
  const improvementOverTime = Number(
    ((Number(avgMetrics.decisionScore ?? 0) - 50) + Number(avgMetrics.stabilityDelta ?? 0) * 10).toFixed(2)
  )
  const approvalTrend: MetaSnapshot['approvalTrend'] =
    approvalRate >= 70 ? 'uptrend' : approvalRate >= 45 ? 'stable' : 'downtrend'

  // ── Bias/penalty suggestions ─────────────────────────────────────────────────
  const suggestedBiasAdjustment =
    (avgMetrics.coverageDelta ?? 0) > 0.5 ? 0.05 : (avgMetrics.coverageDelta ?? 0) < -0.5 ? -0.05 : 0
  const suggestedPenaltyAdjustment =
    (avgMetrics.anomaliesDelta ?? 0) > 0.5 ? 0.5 : (avgMetrics.anomaliesDelta ?? 0) < -0.5 ? -0.5 : 0

  const id = `meta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  await prisma.$executeRawUnsafe(
    `INSERT INTO autonomous_meta_snapshots
     (id, total_approved, total_rejected, avg_metrics, insights,
      suggested_bias_adjustment, suggested_penalty_adjustment, suggested_threshold_adjustments,
      learning_rate, improvement_over_time, approval_trend, cross_module_correlations, cross_module_insights)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8::jsonb, $9, $10, $11, $12::jsonb, $13::jsonb)`,
    id,
    totalApproved,
    totalRejected,
    JSON.stringify(avgMetrics),
    JSON.stringify(insights),
    suggestedBiasAdjustment,
    suggestedPenaltyAdjustment,
    JSON.stringify(suggestedThresholds),
    learningRate,
    improvementOverTime,
    approvalTrend,
    JSON.stringify(crossModuleCorrelations),
    JSON.stringify(crossModuleInsights)
  )

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM autonomous_meta_snapshots WHERE id = $1`,
    id
  )
  return normalize(rows[0])
}

export async function getLatestMetaSnapshot(): Promise<MetaSnapshot | null> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM autonomous_meta_snapshots ORDER BY computed_at DESC LIMIT 1`
  )
  return rows[0] ? normalize(rows[0]) : null
}
