export type LabModule = 'scoring' | 'webgl' | 'pipeline' | 'operator'

export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'tested'
  | 'review_required'
  | 'approved'
  | 'rejected'

export interface ExperimentMetrics {
  coverageDelta?: number
  stabilityDelta?: number
  anomaliesDelta?: number
  perfDelta?: number
  qualityDelta?: number
  riskSeparationDelta?: number
  snapshotDriftDelta?: number
  bucketChurnDelta?: number
  decisionScore?: number
  [key: string]: number | string | undefined
}

export interface ShadowScoringResult {
  baselineAverage: number
  candidateAverage: number
  baselineCoverage: number
  candidateCoverage: number
  baselineAnomalies: number
  candidateAnomalies: number
  coverageDelta: number
  stabilityDelta: number
  anomaliesDelta: number
  riskSeparationBaseline: number
  riskSeparationCandidate: number
  riskSeparationDelta: number
  snapshotDriftBaseline: number
  snapshotDriftCandidate: number
  snapshotDriftDelta: number
  bucketChurnBaseline: number
  bucketChurnCandidate: number
  bucketChurnDelta: number
  sampleSize: number
}

export interface LabExperiment {
  id: string
  module: LabModule
  hypothesis: string
  changes: string[]
  status: ExperimentStatus
  metrics: ExperimentMetrics
  candidateConfig?: Record<string, unknown>
  baselineSnapshotId?: number
  candidateSnapshotId?: number
  orchestratorReport?: Record<string, unknown>
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface SafeOperatorAction {
  type: 'queue_job' | 'warm_cache' | 'redis_health' | 'snapshot_cache_invalidate'
  payload?: Record<string, unknown>
}

export interface PromotionRequest {
  id: string
  experimentId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy?: string
  reviewedBy?: string
  reason?: string
  reviewNote?: string
  createdAt: string
  reviewedAt?: string
}

export interface PromotionThreshold {
  module: LabModule
  minCoverageDelta: number
  minStabilityDelta: number
  minAnomaliesDelta: number
  minRiskSeparationDelta: number
  minSnapshotDriftDelta: number
  minBucketChurnDelta: number
  minPerfDelta: number
  minQualityDelta: number
  minDecisionScore: number
  updatedAt: string
}
