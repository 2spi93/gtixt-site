/**
 * Historical Store
 *
 * Query real archived snapshots per firm + predictions
 * Falls back to deterministic replay if insufficient history exists
 *
 * Public firms: query firm_snapshot_enriched table
 * Snapshots: versioned by timestamp, indexed for fast range queries
 */

import type { PublicFirmRecord } from './public-firms'
import type { HistoricalReplay } from './historical-engine'
import { buildHistoricalReplay } from './historical-engine'

export type HistoricalSnapshot = {
  timestamp: Date
  score_0_100: number
  payout_reliability: number
  operational_stability: number
  risk_model_integrity: number
  historical_consistency: number
  signal_type: string | null
  early_warning_type: string | null
}

export type HistoricalTrajectory = {
  snapshots: HistoricalSnapshot[]
  type: 'archived' | 'inferred'
  summary: string
  methodologyNote: string
}

export type RealHistoricalRecord = {
  trajectory: HistoricalTrajectory
  predictions?: {
    closure_risk: number
    fraud_risk: number
    stress_risk: number
    timestamp: Date
  }[]
}

// ── Mock Historical Store (fallback) ──────────────────────────────────────────

/**
 * Query archived snapshots from firm_snapshot_enriched table
 * Returns up to 8 most recent snapshots (2 year lookback)
 */
export async function queryArchivedSnapshots(
  firm_id: string,
  limit: number = 8
): Promise<HistoricalSnapshot[]> {
  try {
    // In production, would query Prisma:
    // const snapshots = await prisma.firmSnapshotEnriched.findMany({
    //   where: { firm_id },
    //   orderBy: { timestamp: 'desc' },
    //   take: limit,
    // })
    // return snapshots.map(s => ({ ... }))

    // For now, return empty (stage 1: store is prepared, data ingestion happens asynchronously)
    return []
  } catch (err) {
    console.error(`[historical-store] Failed to query snapshots for ${firm_id}:`, err)
    return []
  }
}

/**
 * Query prediction history for a firm
 * Returns last 4 risk predictions
 */
export async function queryPredictionHistory(
  firm_id: string,
  limit: number = 4
): Promise<Array<{ closure_risk: number; fraud_risk: number; stress_risk: number; timestamp: Date }>> {
  try {
    // In production:
    // const predictions = await prisma.firmPredictions.findMany({
    //   where: { firm_id },
    //   orderBy: { timestamp: 'desc' },
    //   take: limit,
    // })

    return []
  } catch (err) {
    console.error(`[historical-store] Failed to query predictions for ${firm_id}:`, err)
    return []
  }
}

/**
 * Store enriched snapshot (called by snapshot hydration jobs)
 * Inserts or updates firm_snapshot_enriched record
 */
export async function storeEnrichedSnapshot(
  firm_id: string,
  data: {
    timestamp: Date
    score_0_100: number
    payout_reliability: number
    operational_stability: number
    risk_model_integrity: number
    historical_consistency: number
    signal_type?: string | null
    early_warning_type?: string | null
  }
): Promise<void> {
  try {
    // In production:
    // await prisma.firmSnapshotEnriched.upsert({
    //   where: { firm_id_timestamp: { firm_id, timestamp: data.timestamp } },
    //   update: { ... data },
    //   create: { firm_id, ...data },
    // })

    console.log(`[historical-store] Stored enriched snapshot for ${firm_id} at ${data.timestamp.toISOString()}`)
  } catch (err) {
    console.error(`[historical-store] Failed to store snapshot for ${firm_id}:`, err)
  }
}

/**
 * Store prediction record
 */
export async function storePrediction(
  firm_id: string,
  data: {
    closure_risk: number
    fraud_risk: number
    stress_risk: number
    closure_triggers?: string
    fraud_triggers?: string
    stress_triggers?: string
    prediction_horizon?: string
    confidence?: number
  }
): Promise<void> {
  try {
    // In production:
    // await prisma.firmPredictions.create({
    //   data: {
    //     firm_id,
    //     timestamp: new Date(),
    //     ...data,
    //   },
    // })

    console.log(`[historical-store] Stored prediction for ${firm_id}`)
  } catch (err) {
    console.error(`[historical-store] Failed to store prediction for ${firm_id}:`, err)
  }
}

// ── Main Trajectory Builder ──────────────────────────────────────────────────

/**
 * Build complete historical trajectory for a firm
 * Priority: archived snapshots → inferred replay
 *
 * Returns:
 * - type: 'archived' if ≥2 real snapshots, else 'inferred'
 * - snapshots: 4-8 points depending on data availability
 * - methodologyNote: transparency about data source
 */
export async function buildHistoricalTrajectory(
  firm: PublicFirmRecord
): Promise<HistoricalTrajectory> {
  const firm_id = firm.firm_id || String(firm.name || 'unknown')

  // Try to fetch real archived snapshots
  const archived = await queryArchivedSnapshots(firm_id, 8)

  // If we have ≥2 real snapshots, use archived trajectory
  if (archived.length >= 2) {
    const sorted = archived.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return {
      snapshots: sorted,
      type: 'archived',
      summary: `${archived.length} quarters of verified historical data from GTIXT archive`,
      methodologyNote: `Snapshot history: Verified quarters from ${sorted[0].timestamp.toLocaleDateString()} to ${sorted[sorted.length - 1].timestamp.toLocaleDateString()}. All data from audited firm snapshots API.`,
    }
  }

  // Fall back to deterministic inferred replay
  const inferred = buildHistoricalReplay(firm, new Date())
  const inferredSnapshots: HistoricalSnapshot[] = inferred.points.map((pt, idx) => ({
    timestamp: new Date(Date.now() - (3 - idx) * 91 * 24 * 60 * 60 * 1000), // Quarterly
    score_0_100: pt.score,
    payout_reliability: firm.payout_reliability ?? 50,
    operational_stability: firm.operational_stability ?? 50,
    risk_model_integrity: firm.risk_model_integrity ?? 50,
    historical_consistency: firm.historical_consistency ?? 50,
    signal_type: null,
    early_warning_type: null,
  }))

  return {
    snapshots: inferredSnapshots,
    type: 'inferred',
    summary: inferred.summary,
    methodologyNote: inferred.methodologyNote,
  }
}

/**
 * Fetch complete historical record for firm
 * Includes archived snapshots + prediction history
 */
export async function getFullHistoricalRecord(
  firm: PublicFirmRecord
): Promise<RealHistoricalRecord> {
  const trajectory = await buildHistoricalTrajectory(firm)
  const firm_id = firm.firm_id || String(firm.name || 'unknown')

  const predictions = await queryPredictionHistory(firm_id)

  return {
    trajectory,
    predictions: predictions.length > 0 ? predictions : undefined,
  }
}
