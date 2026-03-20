/**
 * Prediction V2 Card Component
 *
 * Display closure/fraud/stress risk predictions with triggers
 * Renders three segmented bars + trigger breakdowns
 */

'use client'

import type { RiskPrediction } from '@/lib/prediction-engine'
import { interpretRiskProbability } from '@/lib/risk-interpretation'

const RISK_COLORS: Record<string, string> = {
  closure: 'text-red-500 bg-red-500/10',
  fraud: 'text-purple-500 bg-purple-500/10',
  stress: 'text-orange-500 bg-orange-500/10',
}

const SEVERITY_BADGES: Record<string, string> = {
  watch: 'bg-blue-500/15 text-blue-400',
  alert: 'bg-orange-500/15 text-orange-400',
  critical: 'bg-red-500/15 text-red-400',
}

const BAND_BADGES: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30',
  moderate: 'bg-yellow-500/15 text-yellow-300 border border-yellow-400/30',
  elevated: 'bg-orange-500/15 text-orange-300 border border-orange-400/30',
  high: 'bg-red-500/15 text-red-300 border border-red-400/30',
  critical: 'bg-red-700/30 text-red-200 border border-red-300/40',
}

export function PredictionV2Card({ prediction }: { prediction: RiskPrediction }) {
  const { closure_risk, fraud_risk, stress_risk, primary_risk, overall_confidence } = prediction

  const risks = [
    { type: 'closure', label: 'Closure Risk', value: closure_risk, triggers: prediction.closure_triggers },
    { type: 'fraud', label: 'Fraud Risk', value: fraud_risk, triggers: prediction.fraud_triggers },
    { type: 'stress', label: 'Stress Risk', value: stress_risk, triggers: prediction.stress_triggers },
  ].map((risk) => ({
    ...risk,
    interpretation: interpretRiskProbability(risk.value),
  }))

  const primaryColor = RISK_COLORS[primary_risk] || 'text-gray-400 bg-gray-500/10'

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-purple-300">Prediction V2: Operational Risk</h3>
          <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${primaryColor}`}>
            {primary_risk !== 'none' ? primary_risk.toUpperCase() : 'NOMINAL'}
          </span>
        </div>
        <p className="text-sm text-gray-400">Deterministic risk horizon: Q2–Q3 2026</p>
      </div>

      {/* Risk Bars */}
      <div className="space-y-4">
        {risks.map((risk) => (
          <div key={risk.type} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">{risk.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold text-gray-400">
                  {(risk.value * 100).toFixed(0)}%
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${BAND_BADGES[risk.interpretation.band]}`}>
                  {risk.interpretation.label}
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  risk.type === 'closure'
                    ? 'bg-red-500'
                    : risk.type === 'fraud'
                      ? 'bg-purple-500'
                      : 'bg-orange-500'
                }`}
                style={{
                  width: `${risk.value * 100}%`,
                }}
              />
            </div>

            {/* Threshold indicator */}
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>Low</span>
              <span>Medium (50%)</span>
              <span>High</span>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-1">
              <p className="text-xs text-gray-300 leading-relaxed">{risk.interpretation.interpretation}</p>
              <p className="text-[11px] text-cyan-300 leading-relaxed">Action: {risk.interpretation.recommended_action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Confidence */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <span className="text-sm text-gray-400">Prediction Confidence:</span>
        <span className="text-sm font-semibold text-emerald-400">{(overall_confidence * 100).toFixed(0)}%</span>
      </div>

      {/* Trigger Breakdown */}
      <TriggerBreakdown risks={risks} />

      {/* Methodology */}
      <div className="pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Methodology:</strong> Predictions are computed deterministically from current snapshot pillars
          (payout reliability, operational stability, risk model integrity, historical consistency) + early warning
          signals. No machine learning. All triggers documented below for operator decision-making.
        </p>
      </div>
    </div>
  )
}

// ── Trigger Breakdown Component ──────────────────────────────────────────────

function TriggerBreakdown({ risks }: { risks: any[] }) {
  return (
    <div className="space-y-4 pt-4 border-t border-gray-700/50">
      {risks.map((risk) => (
        <div key={risk.type}>
          <p className="text-sm font-semibold text-gray-300 mb-2">{risk.label} Triggers</p>
          {risk.triggers.length > 0 ? (
            <div className="space-y-2">
              {risk.triggers.map((trigger, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-mono font-semibold ${SEVERITY_BADGES[trigger.severity]}`}>
                    {trigger.severity.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-400">
                      <span className="font-medium">{trigger.name}:</span> {trigger.value}
                    </p>
                    <p className="text-gray-600">
                      Threshold: {trigger.threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600 italic">No active triggers</p>
          )}
        </div>
      ))}
    </div>
  )
}
