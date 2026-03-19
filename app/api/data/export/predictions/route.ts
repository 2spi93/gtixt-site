/**
 * Export API: Predictions
 *
 * Prediction records with triggers (JSON only)
 * Formats: JSON (detailed), JSONL (line-delimited for streaming)
 * Cache: 120s
 */

import { NextResponse } from 'next/server'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { buildRiskPrediction } from '@/lib/prediction-engine'

export const revalidate = 120

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json'
  const riskType = searchParams.get('risk_type') || 'any' // closure, fraud, stress, any
  const minRisk = parseFloat(searchParams.get('min_risk') || '0.4')

  try {
    const { firms } = await loadPublicFirmUniverse()

    // Build predictions for all firms
    const predictions = firms
      .map((firm) => {
        const pred = buildRiskPrediction(firm)

        return {
          firm_id: firm.firm_id,
          name: firm.name,
          score: firm.score_0_100,
          timestamp: new Date().toISOString(),
          prediction_horizon: 'q2-2026',
          closure_risk: Number(pred.closure_risk.toFixed(2)),
          fraud_risk: Number(pred.fraud_risk.toFixed(2)),
          stress_risk: Number(pred.stress_risk.toFixed(2)),
          max_risk: Number(Math.max(pred.closure_risk, pred.fraud_risk, pred.stress_risk).toFixed(2)),
          primary_risk: pred.primary_risk,
          confidence: Number(pred.overall_confidence.toFixed(2)),
          closure_triggers: pred.closure_triggers.map((t) => ({
            name: t.name,
            value: t.value,
            threshold: t.threshold,
            severity: t.severity,
          })),
          fraud_triggers: pred.fraud_triggers.map((t) => ({
            name: t.name,
            value: t.value,
            threshold: t.threshold,
            severity: t.severity,
          })),
          stress_triggers: pred.stress_triggers.map((t) => ({
            name: t.name,
            value: t.value,
            threshold: t.threshold,
            severity: t.severity,
          })),
        }
      })
      .filter((p) => {
        if (riskType === 'any') return p.max_risk >= minRisk
        if (riskType === 'closure') return p.closure_risk >= minRisk
        if (riskType === 'fraud') return p.fraud_risk >= minRisk
        if (riskType === 'stress') return p.stress_risk >= minRisk
        return true
      })

    if (format === 'jsonl') {
      // Line-delimited JSON: one prediction per line
      const jsonl = predictions.map((p) => JSON.stringify(p)).join('\n')
      return new NextResponse(jsonl, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Content-Disposition': `attachment; filename="gtixt-predictions-${new Date().toISOString().split('T')[0]}.jsonl"`,
          'Cache-Control': 'public, max-age=120',
        },
      })
    }

    // Default: JSON
    return NextResponse.json(
      {
        success: true,
        export_date: new Date().toISOString(),
        total_predictions: predictions.length,
        filters: {
          risk_type: riskType,
          min_risk: minRisk,
        },
        predictions,
        export_format: 'json-v1',
        schema_version: '2026-03-19',
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=120',
        },
      }
    )
  } catch (error) {
    console.error('[export/predictions] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
