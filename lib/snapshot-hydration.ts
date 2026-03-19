/**
 * Snapshot Hydration Engine
 *
 * Query archived snapshots from public firm universe
 * Enrich with Prediction V2 scores + signal classifications
 * Store in firm_snapshot_enriched table for historical analysis
 *
 * Run: nightly batch job (via scheduler)
 * Manual: POST /api/admin/batch/snapshot-hydration
 */

import type { PublicFirmRecord } from './public-firms'
import { loadPublicFirmUniverse } from './public-firms'
import { computeFirmSignal } from './signal-engine'
import { detectEarlyWarning } from './risk-engine'
import { buildRiskPrediction } from './prediction-engine'

export type HydrationResult = {
  total_processed: number
  total_stored: number
  total_failed: number
  batches_processed: number
  errors: Array<{ firm_id: string; error: string }>
}

/**
 * Query all public firm snapshots and enrich with predictions
 * This is a mock implementation; in production would query archived snapshots
 * from minio/S3 historical versions
 */
export async function hydrateSnapshotEnriched(): Promise<HydrationResult> {
  console.log('[hydration] Starting snapshot enrichment...')

  let total_processed = 0
  let total_stored = 0
  let total_failed = 0
  let batches_processed = 0
  const errors: Array<{ firm_id: string; error: string }> = []

  try {
    // Load current snapshot
    const { firms, snapshotInfo } = await loadPublicFirmUniverse()
    const snapshotDate = snapshotInfo.created_at ? new Date(snapshotInfo.created_at) : new Date()

    total_processed = firms.length

    // Process in batches of 50
    for (let i = 0; i < firms.length; i += 50) {
      const batch = firms.slice(i, i + 50)

      // Enrich each firm with predictions
      const enrichedBatch = batch.map((firm) => {
        try {
          const signal = computeFirmSignal(firm)
          const earlyWarning = detectEarlyWarning(firm)
          const prediction = buildRiskPrediction(firm)

          return {
            firm_id: firm.firm_id || String(firm.name || 'unknown'),
            timestamp: snapshotDate,
            score_0_100: firm.score_0_100 ?? 0,
            payout_reliability: firm.payout_reliability ?? 0,
            operational_stability: firm.operational_stability ?? 0,
            risk_model_integrity: firm.risk_model_integrity ?? 0,
            historical_consistency: firm.historical_consistency ?? 0,
            closure_risk: prediction.closure_risk,
            fraud_risk: prediction.fraud_risk,
            stress_risk: prediction.stress_risk,
            signal_type: signal.type,
            early_warning_type: earlyWarning?.type || null,
          }
        } catch (err) {
          const firmId = firm.firm_id || String(firm.name || 'unknown')
          const errMsg = err instanceof Error ? err.message : String(err)
          errors.push({ firm_id: firmId, error: errMsg })
          total_failed++
          return null
        }
      })

      // Filter nulls (failed enrichments)
      const validBatch = enrichedBatch.filter((item) => item !== null)

      // Store batch (in production, would write to firm_snapshot_enriched table)
      if (validBatch.length > 0) {
        total_stored += validBatch.length
        console.log(`[hydration] Batch ${batches_processed + 1}: ${validBatch.length} records enriched`)

        // In production:
        // await prisma.firmSnapshotEnriched.createMany({
        //   data: validBatch,
        //   skipDuplicates: true,
        // })
      }

      batches_processed++

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(
      `[hydration] Complete: ${total_stored} stored, ${total_failed} failed, ${batches_processed} batches`
    )
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[hydration] Fatal error:', errMsg)
    throw err
  }

  return {
    total_processed,
    total_stored,
    total_failed,
    batches_processed,
    errors,
  }
}

/**
 * Query historical snapshots from firm_snapshot_enriched table
 * Returns time-series data for specific firm
 */
export async function queryFirmHistoricalSnapshots(
  firm_id: string,
  limit: number = 12
): Promise<
  Array<{
    timestamp: Date
    score_0_100: number
    closure_risk: number
    fraud_risk: number
    stress_risk: number
  }>
> {
  try {
    // In production:
    // const snapshots = await prisma.firmSnapshotEnriched.findMany({
    //   where: { firm_id },
    //   orderBy: { timestamp: 'desc' },
    //   take: limit,
    //   select: {
    //     timestamp: true,
    //     score_0_100: true,
    //     closure_risk: true,
    //     fraud_risk: true,
    //     stress_risk: true,
    //   },
    // })
    // return snapshots.reverse() // Order oldest → newest for charting

    // Mock data: return empty for now
    return []
  } catch (err) {
    console.error(`[snapshot-store] Error querying ${firm_id}:`, err)
    return []
  }
}

/**
 * Get latest snapshot for firm
 */
export async function getLatestSnapshot(firm_id: string) {
  try {
    // In production:
    // const latest = await prisma.firmSnapshotEnriched.findFirst({
    //   where: { firm_id },
    //   orderBy: { timestamp: 'desc' },
    //   take: 1,
    // })
    // return latest

    return null
  } catch (err) {
    console.error(`[snapshot-store] Error fetching latest for ${firm_id}:`, err)
    return null
  }
}
