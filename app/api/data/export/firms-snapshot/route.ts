/**
 * Export API: Firms Snapshot
 *
 * Machine-readable snapshot export
 * Formats: JSON (default), CSV
 * Cache: 120s
 */

import { NextResponse } from 'next/server'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { computeFirmSignal } from '@/lib/signal-engine'
import { computeSystemicRisk, detectEarlyWarning } from '@/lib/risk-engine'
import { buildRiskPrediction } from '@/lib/prediction-engine'

export const revalidate = 120 // 2 minutes

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json'
  const scoreMin = parseFloat(searchParams.get('score_min') || '0')
  const riskMax = parseFloat(searchParams.get('risk_max') || '1')

  try {
    const { firms } = await loadPublicFirmUniverse()
    const systemic = computeSystemicRisk(firms)

    // Enrich each firm
    const enriched = firms
      .map((firm) => {
        const signal = computeFirmSignal(firm)
        const earlyWarning = detectEarlyWarning(firm)
        const prediction = buildRiskPrediction(firm)

        return {
          firm_id: firm.firm_id,
          name: firm.name,
          website_root: firm.website_root,
          jurisdiction: firm.jurisdiction,
          score_0_100: firm.score_0_100,
          payout_reliability: firm.payout_reliability,
          operational_stability: firm.operational_stability,
          risk_model_integrity: firm.risk_model_integrity,
          historical_consistency: firm.historical_consistency,
          signal_type: signal.type,
          signal_confidence: signal.confidence,
          early_warning_type: earlyWarning?.type || null,
          early_warning_severity: earlyWarning?.severity || null,
          closure_risk: Number(prediction.closure_risk.toFixed(2)),
          fraud_risk: Number(prediction.fraud_risk.toFixed(2)),
          stress_risk: Number(prediction.stress_risk.toFixed(2)),
          primary_risk: prediction.primary_risk,
          prediction_confidence: Number(prediction.overall_confidence.toFixed(2)),
        }
      })
      .filter(
        (f) =>
          (f.score_0_100 ?? 0) >= scoreMin &&
          Math.max(f.closure_risk, f.fraud_risk, f.stress_risk) <= riskMax
      )

    if (format === 'csv') {
      return csvResponse(enriched, systemic)
    }

    // Default: JSON
    return NextResponse.json(
      {
        success: true,
        snapshot_date: new Date().toISOString(),
        total_firms: enriched.length,
        systemic_risk: {
          level: systemic.level,
          stress_ratio_percent: Number((systemic.stressRatio * 100).toFixed(1)),
          deteriorating_count: systemic.deterioratingCount,
          high_risk_count: systemic.highRiskCount,
          early_warning_count: systemic.earlyWarningCount,
          rising_count: systemic.risingCount,
        },
        firms: enriched,
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
    console.error('[export/firms-snapshot] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// ── CSV Export Helper ──────────────────────────────────────────────────────────

function csvResponse(firms: any[], systemic: any) {
  // Headers
  const headers = [
    'Firm ID',
    'Name',
    'Website',
    'Jurisdiction',
    'Score (0-100)',
    'Payout Reliability',
    'Operational Stability',
    'Risk Model Integrity',
    'Historical Consistency',
    'Signal Type',
    'Signal Confidence',
    'Early Warning',
    'EW Severity',
    'Closure Risk',
    'Fraud Risk',
    'Stress Risk',
    'Primary Risk',
    'Prediction Confidence',
  ]

  // Rows
  const rows = firms.map((f) => [
    f.firm_id || '',
    f.name || '',
    f.website_root || '',
    f.jurisdiction || '',
    f.score_0_100?.toFixed(1) || '',
    f.payout_reliability?.toFixed(1) || '',
    f.operational_stability?.toFixed(1) || '',
    f.risk_model_integrity?.toFixed(1) || '',
    f.historical_consistency?.toFixed(1) || '',
    f.signal_type || '',
    f.signal_confidence?.toFixed(2) || '',
    f.early_warning_type || '',
    f.early_warning_severity || '',
    f.closure_risk?.toFixed(2) || '',
    f.fraud_risk?.toFixed(2) || '',
    f.stress_risk?.toFixed(2) || '',
    f.primary_risk || '',
    f.prediction_confidence?.toFixed(2) || '',
  ])

  // Escape CSV values
  const escapeCSV = (val: any) => {
    const str = String(val || '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Build CSV
  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  // Footer with systemic stats
  const footer = `

Systemic Risk Summary
Level,${systemic.level}
Stress Ratio,${(systemic.stressRatio * 100).toFixed(1)}%
Deteriorating Firms,${systemic.deterioratingCount}
High Risk Firms,${systemic.highRiskCount}
Early Warnings,${systemic.earlyWarningCount}
Rising Firms,${systemic.risingCount}
Export Date,${new Date().toISOString()}
`

  const fullCsv = csv + footer

  return new NextResponse(fullCsv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gtixt-firms-snapshot-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'public, max-age=120',
    },
  })
}
