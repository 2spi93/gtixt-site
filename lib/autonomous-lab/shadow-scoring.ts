import { prisma } from '@/lib/prisma'
import type { ShadowScoringResult } from './types'

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v))
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((acc, cur) => acc + cur, 0) / values.length
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = average(values)
  const variance = average(values.map((x) => (x - mean) ** 2))
  return Math.sqrt(variance)
}

function mean(values: number[]): number {
  return average(values)
}

function inferBucket(score: number): 'low' | 'medium' | 'high' {
  if (score >= 75) return 'low'
  if (score >= 55) return 'medium'
  return 'high'
}

function riskSeparation(scores: number[]): number {
  if (scores.length < 9) return 0
  const sorted = [...scores].sort((a, b) => a - b)
  const third = Math.max(1, Math.floor(sorted.length / 3))
  const low = sorted.slice(0, third)
  const high = sorted.slice(sorted.length - third)
  return mean(high) - mean(low)
}

export async function runShadowScoring(input?: {
  sampleLimit?: number
  candidateBias?: number
  naPenaltyWeight?: number
}): Promise<ShadowScoringResult> {
  const sampleLimit = Math.max(50, Math.min(input?.sampleLimit ?? 500, 5000))
  const candidateBias = typeof input?.candidateBias === 'number' ? input.candidateBias : 0.8
  const naPenaltyWeight = typeof input?.naPenaltyWeight === 'number' ? input.naPenaltyWeight : 8

  const latestSnapshot = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `SELECT id FROM snapshot_metadata ORDER BY created_at DESC LIMIT 1`
  )

  if (!latestSnapshot[0]) {
    return {
      baselineAverage: 0,
      candidateAverage: 0,
      baselineCoverage: 0,
      candidateCoverage: 0,
      baselineAnomalies: 0,
      candidateAnomalies: 0,
      coverageDelta: 0,
      stabilityDelta: 0,
      anomaliesDelta: 0,
      riskSeparationBaseline: 0,
      riskSeparationCandidate: 0,
      riskSeparationDelta: 0,
      snapshotDriftBaseline: 0,
      snapshotDriftCandidate: 0,
      snapshotDriftDelta: 0,
      bucketChurnBaseline: 0,
      bucketChurnCandidate: 0,
      bucketChurnDelta: 0,
      sampleSize: 0,
    }
  }

  const snapshotId = latestSnapshot[0].id

  const previousSnapshotRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `SELECT id FROM snapshot_metadata WHERE id < $1 ORDER BY created_at DESC LIMIT 1`,
    snapshotId
  )
  const previousSnapshotId = previousSnapshotRows[0]?.id ?? null

  const rows = await prisma.$queryRawUnsafe<Array<{ score_0_100: any; na_rate: any }>>(
    `
      SELECT score_0_100, na_rate
      FROM snapshot_scores
      WHERE snapshot_id = $1
      ORDER BY firm_id
      LIMIT $2
    `,
    snapshotId,
    sampleLimit
  )

  const baselineScores: number[] = []
  const candidateScores: number[] = []
  let baselineCoverage = 0
  let candidateCoverage = 0
  let baselineAnomalies = 0
  let candidateAnomalies = 0

  const rowsWithFirm = await prisma.$queryRawUnsafe<Array<{ firm_id: string; score_0_100: any; na_rate: any }>>(
    `
      SELECT firm_id, score_0_100, na_rate
      FROM snapshot_scores
      WHERE snapshot_id = $1
      ORDER BY firm_id
      LIMIT $2
    `,
    snapshotId,
    sampleLimit
  )

  const previousRows = previousSnapshotId
    ? await prisma.$queryRawUnsafe<Array<{ firm_id: string; score_0_100: any }>>(
        `
          SELECT firm_id, score_0_100
          FROM snapshot_scores
          WHERE snapshot_id = $1
        `,
        previousSnapshotId
      )
    : []

  const previousByFirm = new Map<string, number>()
  for (const row of previousRows) {
    const value = row.score_0_100 == null ? null : Number(row.score_0_100)
    if (value != null && Number.isFinite(value)) {
      previousByFirm.set(row.firm_id, value)
    }
  }

  for (const row of rowsWithFirm) {
    const base = row.score_0_100 == null ? null : Number(row.score_0_100)
    const naRate = row.na_rate == null ? 0 : Number(row.na_rate)

    if (base != null && Number.isFinite(base)) {
      baselineCoverage += 1
      baselineScores.push(base)
      if (base < 0 || base > 100) baselineAnomalies += 1
    }

    let candidate: number | null = null
    if (base != null && Number.isFinite(base)) {
      // Candidate scorer in shadow mode: slight bias with NA-aware penalty.
      candidate = clamp(base + candidateBias - (naRate / 100) * naPenaltyWeight)
    } else if (Number.isFinite(naRate) && naRate < 35) {
      // Shadow candidate can recover some missing scores conservatively.
      candidate = clamp(65 - naRate * 0.3)
    }

    if (candidate != null && Number.isFinite(candidate)) {
      candidateCoverage += 1
      candidateScores.push(candidate)
      if (candidate < 0 || candidate > 100) candidateAnomalies += 1
    }
  }

  const baselineStability = stdDev(baselineScores)
  const candidateStability = stdDev(candidateScores)
  const baselineRiskSeparation = riskSeparation(baselineScores)
  const candidateRiskSeparation = riskSeparation(candidateScores)

  let baselineDriftSum = 0
  let candidateDriftSum = 0
  let driftCount = 0
  let baselineBucketMoves = 0
  let candidateBucketMoves = 0

  for (const row of rowsWithFirm) {
    const prev = previousByFirm.get(row.firm_id)
    const base = row.score_0_100 == null ? null : Number(row.score_0_100)
    const naRate = row.na_rate == null ? 0 : Number(row.na_rate)
    const candidate = base != null && Number.isFinite(base)
      ? clamp(base + candidateBias - (naRate / 100) * naPenaltyWeight)
      : (Number.isFinite(naRate) && naRate < 35 ? clamp(65 - naRate * 0.3) : null)

    if (prev != null && base != null && Number.isFinite(base)) {
      driftCount += 1
      baselineDriftSum += Math.abs(base - prev)

      if (candidate != null && Number.isFinite(candidate)) {
        candidateDriftSum += Math.abs(candidate - prev)
      }

      const prevBucket = inferBucket(prev)
      const curBaseBucket = inferBucket(base)
      if (prevBucket !== curBaseBucket) baselineBucketMoves += 1

      if (candidate != null && Number.isFinite(candidate)) {
        const curCandidateBucket = inferBucket(candidate)
        if (prevBucket !== curCandidateBucket) candidateBucketMoves += 1
      }
    }
  }

  const baselineDrift = driftCount > 0 ? baselineDriftSum / driftCount : 0
  const candidateDrift = driftCount > 0 ? candidateDriftSum / driftCount : 0
  const baselineChurn = driftCount > 0 ? (baselineBucketMoves / driftCount) * 100 : 0
  const candidateChurn = driftCount > 0 ? (candidateBucketMoves / driftCount) * 100 : 0

  return {
    baselineAverage: Number(average(baselineScores).toFixed(2)),
    candidateAverage: Number(average(candidateScores).toFixed(2)),
    baselineCoverage: Number(((baselineCoverage / Math.max(rows.length, 1)) * 100).toFixed(2)),
    candidateCoverage: Number(((candidateCoverage / Math.max(rows.length, 1)) * 100).toFixed(2)),
    baselineAnomalies,
    candidateAnomalies,
    coverageDelta: Number((((candidateCoverage - baselineCoverage) / Math.max(rows.length, 1)) * 100).toFixed(2)),
    stabilityDelta: Number((baselineStability - candidateStability).toFixed(2)),
    anomaliesDelta: baselineAnomalies - candidateAnomalies,
    riskSeparationBaseline: Number(baselineRiskSeparation.toFixed(2)),
    riskSeparationCandidate: Number(candidateRiskSeparation.toFixed(2)),
    riskSeparationDelta: Number((candidateRiskSeparation - baselineRiskSeparation).toFixed(2)),
    snapshotDriftBaseline: Number(baselineDrift.toFixed(2)),
    snapshotDriftCandidate: Number(candidateDrift.toFixed(2)),
    snapshotDriftDelta: Number((baselineDrift - candidateDrift).toFixed(2)),
    bucketChurnBaseline: Number(baselineChurn.toFixed(2)),
    bucketChurnCandidate: Number(candidateChurn.toFixed(2)),
    bucketChurnDelta: Number((baselineChurn - candidateChurn).toFixed(2)),
    sampleSize: rowsWithFirm.length,
  }
}
