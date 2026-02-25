/**
 * GTIXT Enhanced Data Models - Institutional Grade
 * Extends base data models with provenance, validation, and immutability
 */

import {
  EvidenceType,
  ConfidenceLevel,
  PillarId,
  FirmStatus,
  EvidenceItem as BaseEvidenceItem,
} from "./data-models";

export type { PillarId } from "./data-models";

// ============================================================================
// PROVENANCE & TRANSFORMATION TRACKING
// ============================================================================

/**
 * Single transformation step in data processing pipeline
 */
export interface TransformationStep {
  /** Sequential step number */
  step: number;
  /** Type of operation performed */
  operation: "extract" | "normalize" | "validate" | "enrich" | "aggregate";
  /** SHA-256 hash of input data */
  input_hash: string;
  /** SHA-256 hash of output data */
  output_hash: string;
  /** Agent/script that performed transformation */
  agent: string;
  /** Agent version */
  agent_version: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Operation parameters (configuration used) */
  parameters?: Record<string, unknown>;
  /** Duration in milliseconds */
  duration_ms?: number;
}

/**
 * Validation metadata for evidence
 */
export interface EvidenceValidation {
  /** Method used for validation */
  validated_by: "llm" | "rule" | "heuristic" | "manual" | "cross_reference";
  /** Version of validator used */
  validator_version: string;
  /** Validation confidence score (0-100) */
  validation_score: number;
  /** ISO 8601 timestamp of validation */
  validation_timestamp: string;
  /** Optional validation notes */
  validation_notes?: string;
  /** Specific checks performed */
  checks?: Array<{
    check_name: string;
    passed: boolean;
    score_impact: number;
    details?: string;
  }>;
}

/**
 * Complete provenance chain for a piece of evidence
 */
export interface EvidenceProvenance {
  /** Source system that provided the data */
  source_system: "regulatory_crawler" | "financial_crawler" | "news_crawler" | "manual_review" | "api_integration";
  /** Original URL if applicable */
  source_url?: string;
  /** Crawler/agent that collected the data */
  crawler_agent: string;
  /** Crawler agent version */
  crawler_version: string;
  /** Extraction method used */
  extraction_method: "regex" | "llm" | "manual" | "api" | "scraping";
  /** ISO 8601 timestamp of extraction */
  extraction_timestamp: string;
  /** Human operator if manual review */
  operator_id?: string;
  
  /** Complete transformation chain from raw data to final evidence */
  transformation_chain: TransformationStep[];
  
  /** Validation details */
  validation: EvidenceValidation;
  
  /** Raw data hash (original source) */
  raw_data_hash: string;
  /** Storage location of raw data */
  raw_data_archive_url?: string;
}

/**
 * Enhanced evidence item with full provenance and hashing
 */
export interface InstitutionalEvidenceItem extends BaseEvidenceItem {
  /** Unique evidence identifier */
  evidence_id: string;
  
  /** Complete provenance chain */
  provenance: EvidenceProvenance;
  
  /** SHA-256 hash of evidence (content + metadata + provenance) */
  evidence_hash: string;
  
  /** Immutability metadata */
  immutable: {
    created_at: string;
    created_by: string;
    locked: boolean;
    signature?: string;  // Cryptographic signature
  };
}

// ============================================================================
// PROVENANCE GRAPH (Data Lineage)
// ============================================================================

/**
 * Node in the provenance graph
 */
export interface ProvenanceNode {
  /** Unique node identifier */
  id: string;
  /** Type of data at this node */
  type: "raw_data" | "extracted" | "normalized" | "validated" | "aggregated" | "score";
  /** ISO 8601 timestamp */
  timestamp: string;
  /** SHA-256 hash of content at this node */
  hash: string;
  /** Agent/script responsible for this node */
  agent: string;
  /** Agent version */
  agent_version: string;
  /** Human-readable summary */
  content_summary: string;
  /** Reference to actual data (storage URL or database key) */
  content_ref?: string;
}

/**
 * Edge (transformation) in the provenance graph
 */
export interface ProvenanceEdge {
  /** Source node UUID */
  from_node: string;
  /** Destination node UUID */
  to_node: string;
  /** Type of transformation */
  operation: string;
  /** Transformation parameters */
  parameters: Record<string, unknown>;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Duration in milliseconds */
  duration_ms?: number;
}

/**
 * Complete provenance graph for a firm score
 */
export interface ProvenanceGraph {
  /** Firm identifier */
  firm_id: string;
  /** Snapshot date */
  snapshot_date: string;
  /** Unique graph identifier */
  graph_id: string;
  
  /** All nodes in the graph */
  nodes: ProvenanceNode[];
  
  /** All edges (transformations) in the graph */
  edges: ProvenanceEdge[];
  
  /** Entry points (raw data sources) */
  root_nodes: string[];
  
  /** Final node (computed score) */
  final_node: string;
  
  /** Reproducibility metadata */
  reproducibility: {
    can_reproduce: boolean;
    all_inputs_available: boolean;
    all_transformations_deterministic: boolean;
    version_locked: boolean;
    specification_version: string;
    code_commit_hash?: string;
  };
  
  /** Graph metadata */
  metadata: {
    created_at: string;
    node_count: number;
    edge_count: number;
    depth: number;  // Longest path from root to final
  };
}

// ============================================================================
// MULTI-LEVEL HASHING
// ============================================================================

/**
 * Hash at pillar level
 */
export interface PillarHashing {
  pillar_id: PillarId;
  
  /** Hash of sorted evidence list */
  evidence_list_hash: string;
  
  /** Hash of computation (formula + weights + evidence) */
  computation_hash: string;
  
  /** Final pillar hash (score + metadata) */
  final_hash: string;
  
  /** Individual evidence hashes */
  evidence_hashes: Record<string, string>;
}

/**
 * Hash at firm level
 */
export interface FirmHashing {
  firm_id: string;
  
  /** Hash of all pillar hashes combined */
  pillars_hash: string;
  
  /** Hash of aggregation formula */
  aggregation_hash: string;
  
  /** Final firm score hash */
  final_score_hash: string;
  
  /** Per-pillar hashing details */
  pillar_hashing: Record<PillarId, PillarHashing>;
}

/**
 * Multi-level hash structure with Merkle tree
 */
export interface MultiLevelHashing {
  /** Dataset timestamp */
  dataset_timestamp: string;
  
  /** Hash of entire dataset (all firms) */
  dataset_hash: string;
  
  /** Per-firm hashing */
  firm_hashes: Record<string, FirmHashing>;
  
  /** Merkle tree root */
  merkle_root: string;
  
  /** Merkle proofs (optional, for verification) */
  merkle_proofs?: Record<string, {
    firm_id: string;
    proof: string[];  // Path from firm to root
    index: number;
  }>;
  
  /** Hashing metadata */
  metadata: {
    algorithm: "sha256";
    total_firms: number;
    tree_height: number;
    created_at: string;
  };
}

// ============================================================================
// VERSIONED SNAPSHOTS (Immutable)
// ============================================================================

/**
 * Reproducibility bundle for snapshot
 */
export interface ReproducibilityBundle {
  /** URL/hash of exact specification used */
  specification_snapshot: string;
  
  /** Hash of evidence dataset */
  evidence_snapshot_hash: string;
  
  /** URL to evidence archive */
  evidence_archive_url: string;
  
  /** Git commit hash of scoring code */
  code_commit_hash: string;
  
  /** Exact dependency versions */
  dependencies: Record<string, string>;
  
  /** Python/Node version used */
  runtime_version: string;
  
  /** Can this snapshot be reproduced? */
  reproducible: boolean;
}

/**
 * Immutability guarantees for snapshot
 */
export interface SnapshotImmutability {
  /** SHA-256 hash of entire snapshot */
  snapshot_hash: string;
  
  /** Hash of previous snapshot (blockchain-style chain) */
  previous_snapshot_hash: string | null;
  
  /** Cryptographic signature (ECDSA) */
  signature: string;
  
  /** Who/what signed this snapshot */
  signed_by: string;
  
  /** Merkle root for this snapshot */
  merkle_root: string;
  
  /** ISO 8601 timestamp of signing */
  signed_at: string;
}

/**
 * Audit metadata for snapshot lifecycle
 */
export interface SnapshotAuditMetadata {
  /** System/user that created snapshot */
  created_by: string;
  
  /** ISO 8601 creation timestamp */
  created_at: string;
  
  /** Human reviewer (if required) */
  reviewed_by?: string;
  
  /** ISO 8601 review timestamp */
  reviewed_at?: string;
  
  /** Approver for publication */
  approved_by?: string;
  
  /** ISO 8601 approval timestamp */
  approved_at?: string;
  
  /** ISO 8601 publication timestamp */
  publication_timestamp?: string;
  
  /** Retraction info (if applicable) */
  retraction?: {
    retracted_at: string;
    retracted_by: string;
    reason: string;
    replacement_snapshot_id?: string;
  };
}

/**
 * Versioned snapshot (immutable, signed, reproducible)
 */
export interface VersionedSnapshot {
  /** Unique snapshot identifier (UUID) */
  snapshot_id: string;
  
  /** ISO 8601 snapshot timestamp */
  snapshot_timestamp: string;
  
  /** Specification version used */
  specification_version: string;
  
  /** Data version (e.g., "2025-02-24-001") */
  data_version: string;
  
  // === Firm data ===
  firm_id: string;
  firm_name: string;
  score: number;
  pillar_scores: Record<PillarId, number>;
  percentile?: number;
  status: FirmStatus;
  
  // === Immutability guarantees ===
  immutability: SnapshotImmutability;
  
  // === Reproducibility ===
  reproducibility_bundle: ReproducibilityBundle;
  
  // === Audit trail ===
  audit_metadata: SnapshotAuditMetadata;
  
  // === Provenance ===
  provenance_graph_id: string;
  provenance_graph_url?: string;
  
  // === Evidence archive ===
  evidence_archive_url: string;
  
  // === Multi-level hashing ===
  hashing: FirmHashing;
}

// ============================================================================
// AGENT VALIDATION LAYER
// ============================================================================

/**
 * LLM-based validation result
 */
export interface LLMValidation {
  /** LLM model used */
  model: "gpt-4" | "gpt-4-turbo" | "claude-3-opus" | "claude-3-sonnet";
  
  /** Prompt version used */
  prompt_version: string;
  
  /** Confidence score from LLM (0-100) */
  confidence_score: number;
  
  /** LLM reasoning/explanation */
  reasoning: string;
  
  /** ISO 8601 timestamp */
  timestamp: string;
  
  /** Flags raised by LLM */
  flags: Array<{
    type: 'warning' | 'inconsistency' | 'unverifiable' | 'contradiction';
    severity: 'warning' | 'error';
    description: string;
  }>;
  
  /** Token usage */
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Rule-based validation result
 */
export interface RuleValidation {
  rules_applied: Array<{
    rule_id: string;
    rule_name: string;
    rule_version: string;
    passed: boolean;
    score_impact: number;
    details: string;
    is_warning: boolean;
  }>;
  
  /** Overall score from all rules (0-100) */
  overall_score: number;
  
  /** Number of rules passed/failed */
  summary: {
    total_rules: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Heuristic-based validation result
 */
export interface HeuristicValidation {
  anomaly_checks: Array<{
    name: string;
    score: number; // 0-100
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  
  /** Overall anomaly score (0-100, higher = more suspicious) */
  overall_anomaly_score: number;
  
  /** Summary of heuristic analysis */
  summary: {
    total_checks: number;
    severity_counts: {
      high: number;
      medium: number;
      low: number;
    };
    is_anomaly: boolean;
    anomaly_level: 'high' | 'medium' | 'low';
  };
}

/**
 * Cross-reference validation (checking multiple sources)
 */
export interface CrossReferenceValidation {
  /** Consistency checks performed */
  consistency_checks: Array<{
    related_source: string;
    consistency_type: 'agreement' | 'conflict' | 'neutral';
    similarity_score: number;
    details: string;
  }>;
  
  /** Agreement score (0-100, higher = more consistent across sources) */
  agreement_score: number;
  
  /** Summary of cross-reference analysis */
  summary: {
    related_evidence_count: number;
    agreement_sources: number;
    conflict_sources: number;
    neutral_sources: number;
    conflicts: Array<{
      source: string;
      conflict_type: string;
      severity: 'low' | 'medium' | 'high';
      details: string;
    }>;
  };
}

/**
 * Complete multi-method validation for a piece of evidence
 */
export interface AgentValidationLayer {
  /** Unique validation identifier */
  validation_id: string;
  
  /** Evidence item being validated */
  evidence_item_id: string;
  
  /** All validation methods applied */
  validations: {
    llm_validation?: LLMValidation;
    rule_validation: RuleValidation;
    heuristic_validation: HeuristicValidation;
    cross_reference?: CrossReferenceValidation;
  };
  
  /** Final combined validation result */
  final_validation: {
    /** Overall confidence level */
    overall_confidence: ConfidenceLevel;
    
    /** Numerical validation score (0-100) */
    validation_score: number;
    
    /** Is evidence approved for use? */
    approved: boolean;
    
    /** All flags raised across all methods */
    flags: string[];
    
    /** Human reviewer notes (if manual review occurred) */
    reviewer_notes?: string;
    
    /** ISO 8601 timestamp of final validation */
    timestamp: string;
    
    /** Who made final decision (system or human) */
    validated_by: string;
  };
}

// ============================================================================
// GOVERNANCE STRUCTURES
// ============================================================================

/**
 * Methodology committee decision
 */
export interface CommitteeDecision {
  decision_id: string;
  decision_type: "specification_change" | "firm_retraction" | "error_correction" | "policy_update";
  proposal_date: string;
  decision_date: string;
  
  /** Committee members who voted */
  votes: Array<{
    member_id: string;
    member_role: string;
    vote: "approve" | "reject" | "abstain";
    reasoning?: string;
  }>;
  
  /** Vote outcome */
  outcome: {
    approved: boolean;
    votes_for: number;
    votes_against: number;
    abstentions: number;
  };
  
  /** Decision details */
  details: {
    summary: string;
    rationale: string;
    impact_assessment: string;
    implementation_timeline?: string;
  };
  
  /** Public minutes URL */
  minutes_url?: string;
}

/**
 * Error correction record
 */
export interface ErrorCorrection {
  error_id: string;
  detected_date: string;
  
  /** Error classification */
  severity: "critical" | "major" | "minor";
  
  /** What was wrong */
  error_description: string;
  
  /** Root cause */
  root_cause: string;
  
  /** Affected snapshots/firms */
  affected: {
    firm_ids: string[];
    snapshot_ids: string[];
    score_impact_range: { min: number; max: number };
  };
  
  /** Correction applied */
  correction: {
    corrected_at: string;
    corrected_by: string;
    correction_method: string;
    new_snapshot_ids: string[];
  };
  
  /** Post-mortem */
  post_mortem: {
    published_at: string;
    url: string;
    lessons_learned: string[];
    preventive_measures: string[];
  };
}

/**
 * Firm contestation/dispute record
 */
export interface FirmContestation {
  contestation_id: string;
  firm_id: string;
  submitted_date: string;
  submitted_by: string;  // Name/email of submitter
  
  /** Contestation details */
  claim: {
    disputed_snapshot_id: string;
    disputed_score: number;
    claimed_correct_score?: number;
    reasoning: string;
    evidence_provided: string[];  // URLs/docs
  };
  
  /** Investigation */
  investigation: {
    investigator: string;
    started_at: string;
    completed_at?: string;
    findings: string;
  };
  
  /** Decision */
  decision: {
    decided_at: string;
    decided_by: string;
    outcome: "accepted" | "rejected" | "partial";
    reasoning: string;
    correction_applied?: string;
  };
  
  /** Public record (anonymized if requested) */
  public_record_url?: string;
}
