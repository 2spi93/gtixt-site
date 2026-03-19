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
import type { FirmSignalType } from './signal-engine'
import { computeFirmSignal } from './signal-engine'
import type { EarlyWarningType } from './risk-engine'
import { detectEarlyWarning } from './risk-engine'
import { buildRiskPrediction } from './prediction-engine'
import { prisma } from './prisma'

export type HydrationResult = {
  total_processed: number
  total_stored: number
  total_failed: number
  batches_processed: number
  errors: Array<{ firm_id: string; error: string }>
}

type EnrichedSnapshotRow = {
  firm_id: string
  timestamp: Date
  score_0_100: number
  payout_reliability: number
  operational_stability: number
  risk_model_integrity: number
  historical_consistency: number
  closure_risk: number
  fraud_risk: number
  stress_risk: number
  signal_type: FirmSignalType
  early_warning_type: EarlyWarningType | null
}

let snapshotTableReady = false

async function ensureSnapshotTable(): Promise<void> {
  if (snapshotTableReady) {
    return
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS firm_snapshot_enriched (
      id BIGSERIAL PRIMARY KEY,
      firm_id TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      score_0_100 NUMERIC(5,2),
      payout_reliability NUMERIC(5,2),
      operational_stability NUMERIC(5,2),
      risk_model_integrity NUMERIC(5,2),
      historical_consistency NUMERIC(5,2),
      closure_risk NUMERIC(3,2),
      fraud_risk NUMERIC(3,2),
      stress_risk NUMERIC(3,2),
      signal_type TEXT,
      early_warning_type TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT firm_snapshot_enriched_firm_id_timestamp_key UNIQUE (firm_id, timestamp)
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_firm_snapshot_enriched_firm_timestamp
    ON firm_snapshot_enriched (firm_id, timestamp DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_firm_snapshot_enriched_timestamp
    ON firm_snapshot_enriched (timestamp DESC)
  `)

  snapshotTableReady = true
}

async function upsertEnrichedBatch(rows: EnrichedSnapshotRow[]): Promise<void> {
  if (rows.length === 0) {
    return
  }

  await ensureSnapshotTable()

  await prisma.$transaction(
    rows.map((row) =>
      prisma.$executeRaw`
        INSERT INTO firm_snapshot_enriched (
          firm_id,
          timestamp,
          score_0_100,
          payout_reliability,
          operational_stability,
          risk_model_integrity,
          historical_consistency,
          closure_risk,
          fraud_risk,
          stress_risk,
          signal_type,
          early_warning_type
        ) VALUES (
          ${row.firm_id},
          ${row.timestamp},
          ${row.score_0_100},
          ${row.payout_reliability},
          ${row.operational_stability},
          ${row.risk_model_integrity},
          ${row.historical_consistency},
          ${row.closure_risk},
          ${row.fraud_risk},
          ${row.stress_risk},
          ${row.signal_type},
          ${row.early_warning_type}
        )
        ON CONFLICT (firm_id, timestamp)
        DO UPDATE SET
          score_0_100 = EXCLUDED.score_0_100,
          payout_reliability = EXCLUDED.payout_reliability,
          operational_stability = EXCLUDED.operational_stability,
          risk_model_integrity = EXCLUDED.risk_model_integrity,
          historical_consistency = EXCLUDED.historical_consistency,
          closure_risk = EXCLUDED.closure_risk,
          fraud_risk = EXCLUDED.fraud_risk,
          stress_risk = EXCLUDED.stress_risk,
          signal_type = EXCLUDED.signal_type,
          early_warning_type = EXCLUDED.early_warning_type
      `
    )
  )
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
      const validBatch = enrichedBatch.filter((item): item is EnrichedSnapshotRow => item !== null)

      if (validBatch.length > 0) {
        try {
          await upsertEnrichedBatch(validBatch)
          total_stored += validBatch.length
          console.log(
            `[hydration] Batch ${batches_processed + 1}: ${validBatch.length} records enriched`
          )
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          total_failed += validBatch.length
          for (const row of validBatch) {
            errors.push({ firm_id: row.firm_id, error: `db_write_failed: ${errMsg}` })
          }
          console.error(`[hydration] Batch ${batches_processed + 1} DB write error:`, errMsg)
        }
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
    const snapshots = await prisma.$queryRaw<
      Array<{
        timestamp: Date
        score_0_100: number | string | null
        closure_risk: number | string | null
        fraud_risk: number | string | null
        stress_risk: number | string | null
      }>
    >`
      SELECT
        timestamp,
        score_0_100,
        closure_risk,
        fraud_risk,
        stress_risk
      FROM firm_snapshot_enriched
      WHERE firm_id = ${firm_id}
      ORDER BY timestamp DESC
      LIMIT ${Math.max(1, Math.min(limit, 120))}
    `

    return snapshots
      .reverse()
      .map((row) => ({
        timestamp: new Date(row.timestamp),
        score_0_100: Number(row.score_0_100 ?? 0),
        closure_risk: Number(row.closure_risk ?? 0),
        fraud_risk: Number(row.fraud_risk ?? 0),
        stress_risk: Number(row.stress_risk ?? 0),
      }))
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
    const rows = await prisma.$queryRaw<
      Array<{
        firm_id: string
        timestamp: Date
        score_0_100: number | string | null
        closure_risk: number | string | null
        fraud_risk: number | string | null
        stress_risk: number | string | null
        signal_type: string | null
        early_warning_type: string | null
      }>
    >`
      SELECT
        firm_id,
        timestamp,
        score_0_100,
        closure_risk,
        fraud_risk,
        stress_risk,
        signal_type,
        early_warning_type
      FROM firm_snapshot_enriched
      WHERE firm_id = ${firm_id}
      ORDER BY timestamp DESC
      LIMIT 1
    `

    const latest = rows[0]
    if (!latest) {
      return null
    }

    return {
      ...latest,
      score_0_100: Number(latest.score_0_100 ?? 0),
      closure_risk: Number(latest.closure_risk ?? 0),
      fraud_risk: Number(latest.fraud_risk ?? 0),
      stress_risk: Number(latest.stress_risk ?? 0),
    }
  } catch (err) {
    console.error(`[snapshot-store] Error fetching latest for ${firm_id}:`, err)
    return null
  }
}
