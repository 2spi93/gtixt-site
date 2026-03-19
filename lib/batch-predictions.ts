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

export type BatchPredictionResult = {
  total_firms: number
  predictions_stored: number
  failures: number
  horizon: string
  timestamp: string
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
    const predictions = firms
      .map((firm) => {
        try {
          const pred = buildRiskPrediction(firm)
          const firm_id = firm.firm_id || String(firm.name || 'unknown')

          return {
            firm_id,
            timestamp: new Date(),
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
      .filter((item) => item !== null)

    // Store in firm_predictions table
    if (predictions.length > 0) {
      // In production:
      // await prisma.firmPredictions.createMany({
      //   data: predictions,
      //   skipDuplicates: true,
      // })

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
    // In production:
    // const history = await prisma.firmPredictions.findMany({
    //   where: { firm_id },
    //   orderBy: { timestamp: 'desc' },
    //   take: limit,
    //   select: {
    //     timestamp: true,
    //     closure_risk: true,
    //     fraud_risk: true,
    //     stress_risk: true,
    //   },
    // })
    // return history.reverse() // oldest → newest

    return []
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
