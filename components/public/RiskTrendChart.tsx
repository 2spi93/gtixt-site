/**
 * Risk Trend Chart Component
 *
 * Visualizes closure/fraud/stress risk trends over time
 * Shows: progression, volatility, acceleration indicators
 */

'use client'

import type { PredictionTrend } from '@/lib/prediction-engine'

interface RiskTrendPoint {
  period: string
  closure_risk: number
  fraud_risk: number
  stress_risk: number
}

interface RiskTrendChartProps {
  firmName: string
  data: RiskTrendPoint[]
  trend?: PredictionTrend
}

export function RiskTrendChart({ firmName, data, trend }: RiskTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-6 text-center text-gray-400">
        No historical prediction data available for {firmName}
      </div>
    )
  }

  // Find min/max for scaling
  const allRisks = data.flatMap((d) => [d.closure_risk, d.fraud_risk, d.stress_risk])
  const maxRisk = Math.max(...allRisks)
  const minRisk = Math.min(...allRisks)
  const range = maxRisk - minRisk || 0.2

  // Render ASCII-style chart with SVG
  const chartHeight = 150
  const chartWidth = Math.max(400, data.length * 60)
  const padding = 40

  // SVG coordinates
  const yScale = (risk: number) => {
    const normalized = (risk - minRisk) / range
    return padding + (1 - normalized) * chartHeight
  }

  const xStep = (chartWidth - padding * 2) / (data.length - 1 || 1)

  const closurePath = data
    .map((d, i) => `${padding + i * xStep},${yScale(d.closure_risk)}`)
    .join(' L ')

  const fraudPath = data
    .map((d, i) => `${padding + i * xStep},${yScale(d.fraud_risk)}`)
    .join(' L ')

  const stressPath = data
    .map((d, i) => `${padding + i * xStep},${yScale(d.stress_risk)}`)
    .join(' L ')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200">{firmName} — Risk Trajectory</h3>
        {trend && (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono px-2 py-1 rounded ${
              trend.trend_direction === 'up'
                ? 'bg-red-500/20 text-red-300'
                : trend.trend_direction === 'down'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-gray-500/20 text-gray-300'
            }`}>
              {trend.trend_direction.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">
              Periods worsening: {trend.periods_worsening} | Multiplier: {trend.trend_multiplier.toFixed(2)}x
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + padding * 2}`}
        className="w-full border border-gray-700 rounded-lg bg-gray-900/50"
        style={{ minHeight: '250px' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + pct * chartHeight}
            x2={chartWidth - padding}
            y2={padding + pct * chartHeight}
            stroke="rgba(107,114,128,0.2)"
            strokeDasharray="4"
            strokeWidth="0.5"
          />
        ))}

        {/* Y-axis labels */}
        <text x={padding - 5} y={padding - 5} textAnchor="end" className="fill-gray-500 text-xs">
          {maxRisk.toFixed(2)}
        </text>
        <text
          x={padding - 5}
          y={padding + chartHeight + 5}
          textAnchor="end"
          className="fill-gray-500 text-xs"
        >
          {minRisk.toFixed(2)}
        </text>

        {/* Closure risk line */}
        <polyline
          points={closurePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Fraud risk line */}
        <polyline points={fraudPath} fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.8" />

        {/* Stress risk line */}
        <polyline points={stressPath} fill="none" stroke="#f97316" strokeWidth="2" opacity="0.8" />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={`data-${i}`}>
            <circle cx={padding + i * xStep} cy={yScale(d.closure_risk)} r="3" fill="#ef4444" />
            <circle cx={padding + i * xStep} cy={yScale(d.fraud_risk)} r="3" fill="#a855f7" />
            <circle cx={padding + i * xStep} cy={yScale(d.stress_risk)} r="3" fill="#f97316" />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % Math.max(1, Math.floor(data.length / 6)) === 0) {
            return (
              <text
                key={`label-${i}`}
                x={padding + i * xStep}
                y={chartHeight + padding + 20}
                textAnchor="middle"
                className="fill-gray-500 text-xs"
              >
                {d.period}
              </text>
            )
          }
          return null
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-gray-400">Closure Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-gray-400">Fraud Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-orange-500" />
          <span className="text-gray-400">Stress Risk</span>
        </div>
      </div>

      {/* Statistics */}
      {data.length >= 2 && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Closure (Latest)</p>
            <p className="text-lg font-bold text-red-400">
              {(data[data.length - 1].closure_risk * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600">
              Δ{((data[data.length - 1].closure_risk - data[0].closure_risk) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Fraud (Latest)</p>
            <p className="text-lg font-bold text-purple-400">
              {(data[data.length - 1].fraud_risk * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600">
              Δ{((data[data.length - 1].fraud_risk - data[0].fraud_risk) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Stress (Latest)</p>
            <p className="text-lg font-bold text-orange-400">
              {(data[data.length - 1].stress_risk * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600">
              Δ{((data[data.length - 1].stress_risk - data[0].stress_risk) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="pt-4 text-xs text-gray-600 leading-relaxed">
        <p>
          <strong>Methodology:</strong> Risk trajectories computed from prediction history. Trend analysis
          detects acceleration signals. Δ shows change from oldest (left) to latest (right) data point.
        </p>
      </div>
    </div>
  )
}
