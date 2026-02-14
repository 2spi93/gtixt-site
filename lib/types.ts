/**
 * Centralized Type Definitions for Firm Data
 * Single source of truth for all firm-related interfaces
 */

/**
 * Fully normalized Firm record
 * All fields are guaranteed to be of the correct type or undefined
 * No string numbers or mixed types
 */
export interface NormalizedFirm {
  // Required fields (always present)
  firm_id: string;
  firm_name: string;
  name: string;
  score_0_100: number; // 0-100 range
  confidence: number;  // 0-1 range
  na_rate: number;     // 0-100 range

  // Optional fields (may be present)
  status?: string;
  website_root?: string;
  logo_url?: string;
  founded_year?: number;
  founded?: string;
  headquarters?: string;
  jurisdiction?: string;
  jurisdiction_tier?: string;
  model_type?: string;
  payout_frequency?: string;
  max_drawdown_rule?: number;
  daily_drawdown_rule?: number;
  rule_changes_frequency?: string;
  executive_summary?: string;
  audit_verdict?: string;
  agent_verdict?: string;
  oversight_gate_verdict?: string;
  pillar_scores?: Record<string, number>;
  metric_scores?: Record<string, number>;
  
  // Enriched fields
  payout_reliability?: number;
  risk_model_integrity?: number;
  operational_stability?: number;
  historical_consistency?: number;
  snapshot_id?: string;
  na_policy_applied?: boolean;
  percentile_vs_universe?: number;  // 0-100
  percentile_vs_model_type?: number; // 0-100
  percentile_vs_jurisdiction?: number; // 0-100
}

/**
 * Raw firm record from API/snapshot (before normalization)
 * May contain mixed types, strings for numbers, etc.
 */
export interface RawFirm {
  firm_id?: string;
  id?: string;
  firm_name?: string;
  name?: string;
  brand_name?: string;
  score_0_100?: number | string;
  score?: number | string;
  integrity_score?: number | string;
  confidence?: number | string;
  na_rate?: number | string;
  status?: string;
  status_gtixt?: string;
  gtixt_status?: string;
  website?: string;
  website_root?: string;
  site?: string;
  homepage?: string;
  home_url?: string;
  logo?: string;
  logo_url?: string;
  brand_logo?: string;
  founded?: string;
  founded_date?: string;
  founded_year?: number | string;
  year_founded?: number | string;
  year_established?: number | string;
  headquarters?: string;
  hq_location?: string;
  jurisdiction?: string;
  registered_jurisdiction?: string;
  jurisdiction_tier?: string;
  tier?: string;
  model_type?: string;
  business_model?: string;
  payout_frequency?: string;
  frequency?: string;
  max_drawdown_rule?: number | string;
  daily_drawdown_rule?: number | string;
  daily_drawdown?: number | string;
  drawdown?: number | string;
  rule_changes_frequency?: string;
  rules_change_freq?: string;
  executive_summary?: string;
  summary?: string;
  audit_verdict?: string;
  verdict?: string;
  agent_verdict?: string;
  oversight_gate_verdict?: string;
  gate_verdict?: string;
  pillar_scores?: Record<string, number | string>;
  metric_scores?: Record<string, number | string>;
  payout_reliability?: number | string;
  risk_model_integrity?: number | string;
  operational_stability?: number | string;
  historical_consistency?: number | string;
  snapshot_id?: string;
  snapshot_key?: string;
  na_policy_applied?: boolean | string;
  percentile_vs_universe?: number | string;
  percentile_vs_model_type?: number | string;
  percentile_vs_jurisdiction?: number | string;
  [key: string]: unknown;
}

/**
 * Snapshot metadata
 */
export interface SnapshotMeta {
  object?: string;
  sha256?: string;
  created_at?: string;
  count?: number;
  snapshot_key?: string;
  total_firms?: number;
  version?: string;
}

/**
 * Historical score record
 */
export interface HistoryRecord {
  snapshot_key: string;
  score: number;
  date: string;
  confidence?: number;
  source?: string;
}

/**
 * Firms list response from API
 */
export interface FirmsListResponse {
  success: boolean;
  count: number;
  total: number;
  limit: number;
  offset: number;
  firms: NormalizedFirm[];
  snapshot_info?: SnapshotMeta;
  error?: string;
}

/**
 * Single firm response from API
 */
export interface FirmDetailResponse {
  firm?: NormalizedFirm;
  snapshot?: SnapshotMeta;
  error?: string;
}

/**
 * Firm history response from API
 */
export interface FirmHistoryResponse {
  firm_id: string;
  history: HistoryRecord[];
  error?: string;
}

/**
 * Metrics detail for display
 */
export interface MetricsDetail {
  label: string;
  value: string | number | null;
  status?: 'success' | 'warning' | 'neutral';
  tooltip?: string;
}

/**
 * Agent evidence record
 */
export interface AgentEvidenceRecord {
  agent_id: string;
  agent_name: string;
  status: 'pass' | 'fail' | 'review' | 'unknown';
  confidence: number; // 0-1
  evidence: string;
  source?: string;
  verified_at?: string;
}

/**
 * Comparative positioning data
 */
export interface ComparativePositioning {
  percentile_vs_universe: number;
  percentile_vs_model_type: number;
  percentile_vs_jurisdiction: number;
  total_universe_count: number;
  model_type_count: number;
  jurisdiction_count: number;
}
