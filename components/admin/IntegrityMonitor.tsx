'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { RealIcon } from '@/components/design-system/RealIcon'

/**
 * 🛡️ Industry Integrity Monitor
 * 
 * Real-time dashboard showing prop firm integrity health
 * Inspired by financial AML/fraud detection dashboards
 */

interface IndustryReport {
  timestamp: string
  total_firms: number
  high_integrity: number
  stable: number
  caution: number
  elevated_risk: number
  structural_risk: number
  high_risk_firms: Array<{
    firm_id: string
    name: string
    score: number
    risk_level: string
    signals: number
  }>
}

export default function IntegrityMonitor() {
  const [report, setReport] = useState<IndustryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
    // Refresh every 5 minutes
    const interval = setInterval(fetchReport, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchReport = async () => {
    try {
      const response = await fetch('/api/integrity/industry-report')
      const data = await response.json()
      setReport(data)
      setError(null)
    } catch (err) {
      setError('Failed to load integrity report')
      console.error('Integrity report error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading integrity analysis...</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-8">
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-800">{error || 'No data available'}</p>
        </Card>
      </div>
    )
  }

  const totalAnalyzed = report.high_integrity + report.stable + report.caution + 
                        report.elevated_risk + report.structural_risk

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
        <h1 className="text-3xl font-bold mb-2">
          <RealIcon name="shield" size={20} className="mr-2" />
          Industry Integrity Monitor
        </h1>
        <p className="text-gray-600">
          Real-time prop trading industry health • Updated {new Date(report.timestamp).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Statistical indicators based on public data • Not legal conclusions
        </p>
        </div>
        <Link href="/admin/integrity/calibration">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Calibration
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* High Integrity */}
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm text-gray-600 mb-1">High Integrity</div>
          <div className="text-3xl font-bold text-green-700">{report.high_integrity}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((report.high_integrity / totalAnalyzed) * 100).toFixed(0)}%
          </div>
        </Card>

        {/* Stable */}
        <Card className="p-4 border-green-100 bg-green-25">
          <div className="text-sm text-gray-600 mb-1">Stable</div>
          <div className="text-3xl font-bold text-green-600">{report.stable}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((report.stable / totalAnalyzed) * 100).toFixed(0)}%
          </div>
        </Card>

        {/* Caution */}
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm text-gray-600 mb-1">Caution</div>
          <div className="text-3xl font-bold text-yellow-700">{report.caution}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((report.caution / totalAnalyzed) * 100).toFixed(0)}%
          </div>
        </Card>

        {/* Elevated Risk */}
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-sm text-gray-600 mb-1">Elevated Risk</div>
          <div className="text-3xl font-bold text-orange-700">{report.elevated_risk}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((report.elevated_risk / totalAnalyzed) * 100).toFixed(0)}%
          </div>
        </Card>

        {/* Structural Risk */}
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-gray-600 mb-1">Structural Risk</div>
          <div className="text-3xl font-bold text-red-700">{report.structural_risk}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((report.structural_risk / totalAnalyzed) * 100).toFixed(0)}%
          </div>
        </Card>

        {/* Total */}
        <Card className="p-4 border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 mb-1">Total Analyzed</div>
          <div className="text-3xl font-bold text-gray-700">{totalAnalyzed}</div>
          <div className="text-xs text-gray-500 mt-1">firms</div>
        </Card>
      </div>

      {/* Industry Health Bar */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Industry Health Breakdown</h2>
        <div className="h-8 flex rounded-lg overflow-hidden">
          <div 
            className="bg-green-500" 
            style={{ width: `${(report.high_integrity / totalAnalyzed) * 100}%` }}
            title={`High Integrity: ${report.high_integrity}`}
          />
          <div 
            className="bg-green-400" 
            style={{ width: `${(report.stable / totalAnalyzed) * 100}%` }}
            title={`Stable: ${report.stable}`}
          />
          <div 
            className="bg-yellow-400" 
            style={{ width: `${(report.caution / totalAnalyzed) * 100}%` }}
            title={`Caution: ${report.caution}`}
          />
          <div 
            className="bg-orange-500" 
            style={{ width: `${(report.elevated_risk / totalAnalyzed) * 100}%` }}
            title={`Elevated Risk: ${report.elevated_risk}`}
          />
          <div 
            className="bg-red-600" 
            style={{ width: `${(report.structural_risk / totalAnalyzed) * 100}%` }}
            title={`Structural Risk: ${report.structural_risk}`}
          />
        </div>
      </Card>

      {/* High-Risk Firms Alert */}
      {report.high_risk_firms && report.high_risk_firms.length > 0 && (
        <Card className="p-6 border-orange-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Firms Requiring Review
            <span className="text-sm font-normal text-gray-500">
              ({report.high_risk_firms.length} flagged)
            </span>
          </h2>
          
          <div className="space-y-3">
            {report.high_risk_firms.slice(0, 10).map((firm) => (
              <div 
                key={firm.firm_id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="font-semibold">{firm.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {firm.signals} integrity signal{firm.signals !== 1 ? 's' : ''} detected
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    firm.score < 35 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {firm.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {firm.risk_level.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold mb-3">Risk Level Definitions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-3">
            <span className="font-medium text-green-700">High Integrity (80-100):</span>
            <span className="text-gray-600">Strong transparency, stable operations, verified track record</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-green-600">Stable (65-79):</span>
            <span className="text-gray-600">Good operational health, minor concerns</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-yellow-700">Caution (50-64):</span>
            <span className="text-gray-600">Some integrity signals warrant monitoring</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-orange-600">Elevated Risk (35-49):</span>
            <span className="text-gray-600">Multiple risk signals detected, review recommended</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-red-600">Structural Risk (0-34):</span>
            <span className="text-gray-600">Significant integrity concerns, high-priority review</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
