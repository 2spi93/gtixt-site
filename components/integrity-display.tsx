'use client'

import { Shield, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface IntegrityScore {
  overall_score: number | null
  risk_level: 'stable' | 'caution' | 'high_risk' | 'critical'
  components: {
    payout_reliability: number | null
    risk_model_integrity: number | null
    operational_stability: number | null
    historical_consistency: number | null
  }
  source: 'profile_derived' | 'snapshot_provided'
  as_of?: string
}

interface IntegrityDisplayProps {
  integrity: IntegrityScore
  variant?: 'full' | 'compact' | 'badge-only'
}

const RISK_LEVEL_CONFIG = {
  stable: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Stable',
    description: 'Strong integrity indicators'
  },
  caution: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Caution',
    description: 'Some concerns identified'
  },
  high_risk: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'High Risk',
    description: 'Multiple integrity concerns'
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Critical',
    description: 'Significant integrity issues'
  }
}

const COMPONENT_LABELS = {
  payout_reliability: 'Payout Reliability',
  risk_model_integrity: 'Risk Model Integrity',
  operational_stability: 'Operational Stability',
  historical_consistency: 'Historical Consistency'
}

export function IntegrityBadge({ integrity }: { integrity: IntegrityScore }) {
  const config = RISK_LEVEL_CONFIG[integrity.risk_level ]
  const Icon = config.icon
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${config.borderColor} gap-1.5`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
      {integrity.overall_score !== null && (
        <span className="font-mono ml-1">
          {integrity.overall_score}/100
        </span>
      )}
    </Badge>
  )
}

export function IntegrityDisplay({ integrity, variant = 'full' }: IntegrityDisplayProps) {
  if (variant === 'badge-only') {
    return <IntegrityBadge integrity={integrity} />
  }

  const config = RISK_LEVEL_CONFIG[integrity.risk_level]
  const Icon = config.icon

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{config.label}</span>
            {integrity.overall_score !== null && (
              <span className="text-sm font-mono font-semibold">
                {integrity.overall_score}/100
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config.description}
          </p>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Integrity Analysis
          </CardTitle>
          <IntegrityBadge integrity={integrity} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        {integrity.overall_score !== null && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-2xl font-bold font-mono">
                {integrity.overall_score}
                <span className="text-sm text-muted-foreground">/100</span>
              </span>
            </div>
            <Progress 
              value={integrity.overall_score} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          </div>
        )}

        {/* Component Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Component Breakdown</h4>
          <div className="grid gap-3">
            {Object.entries(integrity.components).map(([key, value]) => {
              const label = COMPONENT_LABELS[key as keyof typeof COMPONENT_LABELS]
              
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    {value !== null ? (
                      <span className="text-sm font-mono font-medium">
                        {value}/100
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        N/A
                      </span>
                    )}
                  </div>
                  {value !== null && (
                    <Progress 
                      value={value} 
                      className="h-1.5"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Source:</span>
            <span className="font-mono">
              {integrity.source === 'profile_derived' ? 'Profile Metrics' : 'Snapshot Data'}
            </span>
          </div>
          {integrity.as_of && (
            <div className="flex justify-between">
              <span>As of:</span>
              <span className="font-mono">
                {new Date(integrity.as_of).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
