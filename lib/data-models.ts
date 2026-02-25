/**
 * GTIXT Unified Data Models
 * Single source of truth for all API data types
 * These types are used for:
 *  - Frontend type safety
 *  - Backend request/response validation
 *  - SDK code generation
 *  - OpenAPI schema generation
 */

// ============================================================================
// METADATA & COMMON TYPES
// ============================================================================

export interface ApiMeta {
  /** API version (e.g., "1.0.0") */
  api_version: string;
  /** Specification version (e.g., "1.0.0") */
  spec_version: string;
  /** SDK version (e.g., "1.0.0") */
  sdk_version: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}

export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (present if success=true) */
  data?: T;
  /** Error message (present if success=false) */
  error?: string;
  /** Additional metadata */
  meta?: ApiMeta;
  /** Optional message for additional context */
  message?: string;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
  rule?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: number;
  details?: ValidationErrorDetail[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  rule?: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  code: 400;
  details: ValidationError[];
}

// ============================================================================
// FIRM DATA MODELS
// ============================================================================

/** GTIXT 7-pillar scoring structure */
export type PillarId =
  | "regulatory_compliance"
  | "financial_stability"
  | "operational_risk"
  | "governance"
  | "client_protection"
  | "market_conduct"
  | "transparency_disclosure";

/** Confidence levels for evidence */
export type ConfidenceLevel = "high" | "medium" | "low" | "very_low" | "na";

/** Evidence types in scoring system */
export type EvidenceType =
  | "regulatory_filing"
  | "regulatory_action"
  | "financial_report"
  | "audit"
  | "news"
  | "disclosure"
  | "litigation";

/** Firm status */
export type FirmStatus = "published" | "pending" | "retracted";

// ============================================================================
// EVIDENCE MODELS
// ============================================================================

export interface EvidenceItem {
  /** Evidence type (regulatory_filing, audit, etc.) */
  type: EvidenceType;
  /** Human-readable description */
  description: string;
  /** Confidence level (high, medium, low, etc.) */
  confidence: ConfidenceLevel;
  /** ISO 8601 timestamp when evidence was collected */
  timestamp: string;
  /** Source of evidence (FCA_REGISTRY_API, MANUAL_REVIEW, etc.) */
  source: string;
  /** Optional: value or score contributed by this evidence (0-100) */
  value?: number;
  /** Optional: evidence reference or ID */
  reference_id?: string;
}

export interface PillarEvidence {
  /** Pillar identifier (regulatory_compliance, etc.) */
  pillar_id: PillarId;
  /** Human-readable pillar name */
  pillar_name: string;
  /** Weight in final score (0-1, sum across all pillars = 1.0) */
  weight: number;
  /** Computed score for this pillar (0-100) */
  score: number;
  /** Array of evidence items backing this score */
  evidence: EvidenceItem[];
  /** Verification status of this pillar */
  verification_status: "verified" | "unverified";
}

export interface FirmEvidence {
  /** Firm identifier */
  firm_id: string;
  /** Total GTIXT score (0-100) */
  total_score: number;
  /** Snapshot date (YYYY-MM-DD) */
  snapshot_date: string;
  /** Evidence organized by pillar */
  evidence_by_pillar: PillarEvidence[];
  /** Overall verification status */
  verification_status: FirmStatus;
  /** SHA-256 hash for integrity verification */
  sha256: string;
}

// ============================================================================
// SNAPSHOT MODELS
// ============================================================================

export interface PillarScore {
  /** Pillar id */
  id: PillarId;
  /** Score 0-100 */
  score: number;
  /** Weight in aggregation */
  weight: number;
}

export interface FirmSnapshot {
  /** Firm unique identifier */
  firm_id: string;
  /** Firm name */
  firm_name: string;
  /** GTIXT total score (0-100) */
  score: number;
  /** Scores for each of 7 pillars */
  pillar_scores: Record<PillarId, number>;
  /** SHA-256 hash of snapshot for verification */
  sha256: string;
  /** Snapshot status */
  status: FirmStatus;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Specification version used for scoring */
  version: string;
  /** Percentile rank vs all firms (0-100) */
  percentile?: number;
}

export interface HistoricalSnapshot {
  /** Snapshot date (YYYY-MM-DD) */
  date: string;
  /** Specification version used */
  version: string;
  /** GTIXT score on this date (0-100) */
  score: number;
  /** SHA-256 hash for verification */
  sha256: string;
  /** Status on this date */
  status: FirmStatus;
  /** Pillar scores on this date */
  pillar_scores?: Record<PillarId, number>;
}

// ============================================================================
// SPECIFICATION MODELS
// ============================================================================

export interface PillarSpecification {
  /** Pillar id */
  id: PillarId;
  /** Human-readable name */
  name: string;
  /** Weight in final calculation (0-1) */
  weight: number;
  /** Description of measurement */
  description: string;
  /** Version of pillar definition */
  version: string;
  /** Data sources for this pillar */
  data_sources: string[];
  /** Scoring rules */
  rules: ScoringRule[];
}

export interface ScoringRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Condition to apply rule */
  condition?: string;
  /** Rule weight */
  weight: number;
}

export interface ScoringSpecification {
  /** Specification version (MAJOR.MINOR.PATCH) */
  version: string;
  /** When specification became effective (ISO 8601) */
  effective_date: string;
  /** When next revision is planned */
  next_revision: string;
  /** All 7 pillars with weights and rules */
  pillars: PillarSpecification[];
  /** Aggregation formula description */
  aggregation_formula: string;
  /** Normalization rules */
  normalization: {
    /* Min value for pillar scores */
    min: number;
    /* Max value for pillar scores */
    max: number;
    /* Scale target (0-100 or 0-1) */
    target_range: [number, number];
  };
  /** Fallback policy for missing data */
  fallback_policy: {
    /* When evidence is not available, use this value */
    na_value: number;
    /* Description of NA policy */
    description: string;
  };
}

// ============================================================================
// AUDIT TRAIL MODELS
// ============================================================================

export interface AuditRecord {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event type (evidence_added, evidence_reviewed, score_snapshot, etc.) */
  event_type: "evidence_added" | "evidence_reviewed" | "score_snapshot" | "evidence_retracted";
  /** Firm being audited */
  firm_id: string;
  /** What action was performed */
  action: string;
  /** Which pillar was affected */
  pillar_id: PillarId | "aggregate";
  /** Type of evidence */
  evidence_type: EvidenceType | "snapshot";
  /** Evidence description */
  evidence_description: string;
  /** Confidence before this event */
  confidence_before: ConfidenceLevel | null;
  /** Confidence after this event */
  confidence_after: ConfidenceLevel;
  /** Score before this event */
  score_before: number | null;
  /** Score after this event */
  score_after: number;
  /** ID of operator who made change */
  operator_id: string;
  /** Source system */
  source: string;
  /** Additional notes */
  notes: string;
  /** Verification status */
  verification_status: FirmStatus;
  /** SHA-256 hash before */
  sha256_before: string | null;
  /** SHA-256 hash after */
  sha256_after: string;
}

export interface AuditTrailExport {
  /** Export metadata */
  export_metadata: {
    /* Firm ID */
    firm_id: string;
    /* Start date (YYYY-MM-DD) */
    date_start: string;
    /* End date (YYYY-MM-DD) */
    date_end: string;
    /* Export format (json or csv) */
    format: "json" | "csv";
    /* Number of records exported */
    record_count: number;
    /* When export was created */
    export_timestamp: string;
    /* Hash for integrity verification */
    export_hash: string;
  };
  /** Audit records */
  records?: AuditRecord[];
  /** CSV data as string (if format=csv) */
  csv_data?: string;
}

// ============================================================================
// VERIFICATION MODELS
// ============================================================================

export interface VerificationResult {
  /** Whether verification was successful */
  success: boolean;
  /** Firm being verified */
  firm_id: string;
  /** Snapshot date (YYYY-MM-DD) */
  snapshot_date: string;
  /** Originally reported score */
  reported_score: number;
  /** Score computed during verification */
  computed_score: number;
  /** Whether scores match (within ±1) */
  score_match: boolean;
  /** Originally reported hash */
  reported_hash: string;
  /** Hash computed from evidence */
  computed_hash: string;
  /** Whether hashes match */
  hash_match: boolean;
  /** Pillar-by-pillar verification results */
  pillar_details: PillarVerification[];
  /** ISO 8601 timestamp of verification */
  verification_timestamp: string;
  /** Reproducibility verification checks */
  reproducibility_verification: {
    /* Score is deterministic (±1 tolerance) */
    deterministic: boolean;
    /* All 7 pillars have evidence */
    evidence_complete: boolean;
    /* Scoring rules applied correctly */
    rule_application_correct: boolean;
    /* SHA-256 hash matches */
    cryptographic_integrity: boolean;
  };
  /** Human-readable result message */
  message: string;
}

export interface PillarVerification {
  /** Pillar being verified */
  pillar_id: PillarId;
  /** Human-readable pillar name */
  pillar_name: string;
  /** Pillar weight */
  weight: number;
  /** Originally reported score for pillar */
  reported_score: number;
  /** Score computed during verification */
  computed_score: number;
  /** Number of evidence items used */
  evidence_count: number;
  /** Verification status: match, mismatch, or degraded */
  verification_status: "match" | "mismatch" | "degraded";
}

// ============================================================================
// QUERY & FILTER MODELS
// ============================================================================

export interface FirmFilter {
  /** Search by firm ID or name */
  search?: string;
  /** Filter by status */
  status?: FirmStatus;
  /** Min score filter */
  score_min?: number;
  /** Max score filter */
  score_max?: number;
  /** Filter by pillar score */
  pillar_scores?: Partial<Record<PillarId, { min?: number; max?: number }>>;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Sort by field */
  sort_by?: "score" | "name" | "updated_at";
  /** Sort direction */
  sort_order?: "asc" | "desc";
}

export interface SnapshotFilter {
  /** Firm ID (required) */
  firm_id: string;
  /** API specification version */
  version?: string;
  /** Start date (YYYY-MM-DD) */
  date_start?: string;
  /** End date (YYYY-MM-DD) */
  date_end?: string;
  /** Max results */
  limit?: number;
}

// ============================================================================
// REQUEST BODIES
// ============================================================================

export interface VerifyScoreRequest {
  /** Firm to verify */
  firm_id: string;
  /** Snapshot date (YYYY-MM-DD) */
  snapshot_date: string;
  /** Score that was reported */
  reported_score: number;
  /** Evidence organized by pillar ID */
  evidence: Record<PillarId, { score: number; items: EvidenceItem[] }>;
  /** Originally reported hash (optional) */
  reported_hash?: string;
  /** Spec version used */
  specification_version?: string;
}

export interface AuditExportRequest {
  /** Firm ID to export */
  firm_id: string;
  /** Start date (YYYY-MM-DD, optional) */
  date_start?: string;
  /** End date (YYYY-MM-DD, optional) */
  date_end?: string;
  /** Export format */
  format: "json" | "csv";
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginatedResponse<T> {
  /** Items in this page */
  items: T[];
  /** Total count across all pages */
  total: number;
  /** Current page number (0-indexed) */
  page: number;
  /** Items per page */
  per_page: number;
  /** Total pages */
  total_pages: number;
  /** Has more pages */
  has_more: boolean;
}

// ============================================================================
// BACKWARD COMPATIBILITY TYPES (from lib/types.ts)
// ============================================================================

/**
 * Normalized firm record
 * @deprecated Use FirmSnapshot and FirmEvidence instead
 */
export interface NormalizedFirm {
  firm_id: string;
  firm_name: string;
  name: string;
  score_0_100: number;
  confidence: number;
  na_rate: number;
  status?: string;
  website_root?: string;
  logo_url?: string;
  founded_year?: number;
  headquarters?: string;
  jurisdiction?: string;
  pillar_scores?: Record<string, number>;
  metric_scores?: Record<string, number>;
  percentile_vs_universe?: number;
}
