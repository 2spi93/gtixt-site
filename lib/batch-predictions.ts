/**
 * Batch Predictions Job
 *
 * Nightly task: Compute predictions for all firms
 * Store in firm_predictions table with horizon + confidence
 *
 * Triggered by: Scheduler (nightly 2 AM UTC) or manual API call
 */

import { loadPublicFirmUniverse } from './public-firms'
import { buildRiskPrediction } from './prediction-engine'
import { prisma } from './prisma'

export type BatchPredictionResult = {
  total_firms: number
  predictions_stored: number
  failures: number
  horizon: string
  timestamp: string
}

type PredictionInsertRow = {
  firm_id: string
  timestamp: Date
  closure_risk: number
  fraud_risk: number
  stress_risk: number
  closure_triggers: string
  fraud_triggers: string
  stress_triggers: string
  prediction_horizon: string
  confidence: number
}

async function upsertPredictions(rows: PredictionInsertRow[]): Promise<void> {
  if (rows.length === 0) {
    return
  }

  await prisma.$transaction(
    rows.map((row) =>
      prisma.$executeRaw`
        INSERT INTO firm_predictions (
          firm_id,
          timestamp,
          closure_risk,
          fraud_risk,
          stress_risk,
          closure_triggers,
          fraud_triggers,
          stress_triggers,
          prediction_horizon,
          confidence
        ) VALUES (
          ${row.firm_id},
          ${row.timestamp},
          ${row.closure_risk},
          ${row.fraud_risk},
          ${row.stress_risk},
          ${row.closure_triggers},
          ${row.fraud_triggers},
          ${row.stress_triggers},
          ${row.prediction_horizon},
          ${row.confidence}
        )
        ON CONFLICT (firm_id, timestamp, prediction_horizon)
        DO UPDATE SET
          closure_risk = EXCLUDED.closure_risk,
          fraud_risk = EXCLUDED.fraud_risk,
          stress_risk = EXCLUDED.stress_risk,
          closure_triggers = EXCLUDED.closure_triggers,
          fraud_triggers = EXCLUDED.fraud_triggers,
          stress_triggers = EXCLUDED.stress_triggers,
          confidence = EXCLUDED.confidence,
          updated_at = NOW()
      `
    )
  )
}

/**
 * Run batch predictions for entire universe
 * Compute closure/fraud/stress for each firm + store
 */
export async function runBatchPredictions(
  predictionHorizon: string = 'q2-2026'
): Promise<BatchPredictionResult> {
  console.log(`[batch-predictions] Starting predictions for horizon: ${predictionHorizon}`)

  const startTime = Date.now()
  let predictions_stored = 0
  let failures = 0

  try {
    const { firms } = await loadPublicFirmUniverse()

    // Build predictions for all firms
    const timestamp = new Date()
    const predictions = firms
      .map((firm) => {
        try {
          const pred = buildRiskPrediction(firm)
          const firm_id = firm.firm_id || String(firm.name || 'unknown')

          return {
            firm_id,
            timestamp,
            closure_risk: pred.closure_risk,
            fraud_risk: pred.fraud_risk,
            stress_risk: pred.stress_risk,
            closure_triggers: JSON.stringify(pred.closure_triggers),
            fraud_triggers: JSON.stringify(pred.fraud_triggers),
            stress_triggers: JSON.stringify(pred.stress_triggers),
            prediction_horizon: predictionHorizon,
            confidence: pred.overall_confidence,
          }
        } catch (err) {
          failures++
          const firmId = firm.firm_id || String(firm.name || 'unknown')
          console.error(`[batch-predictions] Error predicting ${firmId}:`, err)
          return null
        }
      })
      .filter((item): item is PredictionInsertRow => item !== null)

    if (predictions.length > 0) {
      await upsertPredictions(predictions)
      predictions_stored = predictions.length
      console.log(`[batch-predictions] Stored ${predictions_stored} predictions`)
    }

    const elapsedMs = Date.now() - startTime
    console.log(`[batch-predictions] Complete in ${elapsedMs}ms`)

    return {
      total_firms: firms.length,
      predictions_stored,
      failures,
      horizon: predictionHorizon,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[batch-predictions] Fatal error:', errMsg)
    throw err
  }
}

/**
 * Query prediction history for trend analysis
 * Returns predictions over time for closure/fraud/stress computation
 */
export async function queryPredictionHistory(
  firm_id: string,
  limit: number = 12
): Promise<
  Array<{ timestamp: Date; closure_risk: number; fraud_risk: number; stress_risk: number }>
> {
  try {
    const history = await prisma.$queryRaw<
      Array<{
        timestamp: Date
        closure_risk: number | string
        fraud_risk: number | string
        stress_risk: number | string
      }>
    >`
      SELECT
        timestamp,
        closure_risk,
        fraud_risk,
        stress_risk
      FROM firm_predictions
      WHERE firm_id = ${firm_id}
      ORDER BY timestamp DESC
      LIMIT ${Math.max(1, Math.min(limit, 120))}
    `

    return history
      .reverse()
      .map((row) => ({
        timestamp: new Date(row.timestamp),
        closure_risk: Number(row.closure_risk),
        fraud_risk: Number(row.fraud_risk),
        stress_risk: Number(row.stress_risk),
      }))
  } catch (err) {
    console.error(`[batch-predictions] Error querying history for ${firm_id}:`, err)
    return []
  }
}

/**
 * Helper: Get next scheduled run
 * Assumes nightly 2 AM UTC
 */
export function getNextScheduledRun(): Date {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  tomorrow.setUTCHours(2, 0, 0, 0)
  return tomorrow
}
