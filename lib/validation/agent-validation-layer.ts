/**
 * GTIXT Agent Validation Service
 * 
 * Multi-method validation orchestrator combining:
 * - LLM validation (GPT-4 / Claude-3 reasoning)
 * - Rule validation (deterministic business rules)
 * - Heuristic validation (anomaly detection)
 * - Cross-reference validation (multi-source consistency)
 * 
 * Final score is weighted average of all methods
 * 
 * @module lib/validation/agent-validation-layer
 * @version 1.0.0
 */

import type {
  InstitutionalEvidenceItem,
  AgentValidationLayer,
  LLMValidation,
  RuleValidation,
  HeuristicValidation,
  CrossReferenceValidation,
} from '../institutional-data-models';

import { validateWithLLM } from './llm-validator';
import { validateWithRules } from './rule-validator';
import { validateWithHeuristics } from './heuristic-validator';
import { validateWithCrossReference } from './cross-reference-validator';

// =====================================================
// TYPES
// =====================================================

export interface ValidationInput {
  evidence_item: InstitutionalEvidenceItem;
  snapshot_id?: string;
  firm_id?: string;
  pillar_id?: string;
  related_evidence?: RelatedEvidenceItem[]; // For cross-reference
}

interface RelatedEvidenceItem {
  evidence_id: string;
  source: string;
  description: string;
  impact_on_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  extraction_date: string;
}

export interface ValidationConfig {
  enable_llm: boolean;
  enable_rules: boolean;
  enable_heuristics: boolean;
  enable_cross_reference: boolean;
  require_approval: boolean; // Require manual review if low confidence
  confidence_threshold: number; // Min confidence to auto-approve (0-100)
  weights?: {
    llm_weight: number;
    rule_weight: number;
    heuristic_weight: number;
    cross_reference_weight: number;
  };
}

const DEFAULT_CONFIG: ValidationConfig = {
  enable_llm: true,
  enable_rules: true,
  enable_heuristics: true,
  enable_cross_reference: true,
  require_approval: true,
  confidence_threshold: 80,
  weights: {
    llm_weight: 0.4,      // LLM is most important
    rule_weight: 0.3,     // Rules are deterministic
    heuristic_weight: 0.2, // Heuristics catch anomalies
    cross_reference_weight: 0.1, // Cross-ref breaks ties
  },
};

// =====================================================
// VALIDATION ORCHESTRATOR
// =====================================================

/**
 * Perform multi-method validation on an evidence item
 * 
 * @param input - Evidence and context
 * @param config - Validation configuration
 * @returns Complete validation layer with final decision
 */
export async function validateEvidence(
  input: ValidationInput,
  config: ValidationConfig = DEFAULT_CONFIG
): Promise<AgentValidationLayer> {
  const evidence = input.evidence_item;
  const validationId = generateValidationId(evidence.evidence_id);
  const startTime = Date.now();
  
  // Parallel validation methods
  const [llmVal, ruleVal, heurVal, crossRefVal] = await Promise.all([
    config.enable_llm ? validateWithLLM(evidence) : Promise.resolve(null),
    config.enable_rules ? validateWithRules(evidence, input.pillar_id) : Promise.resolve(null),
    config.enable_heuristics ? validateWithHeuristics(evidence) : Promise.resolve(null),
    config.enable_cross_reference && input.related_evidence
      ? validateWithCrossReference(evidence, input.related_evidence)
      : Promise.resolve(null),
  ]);
  
  const duration = Date.now() - startTime;
  
  // Compute final validation score
  const { finalScore, approved } = computeFinalScore(
    llmVal,
    ruleVal,
    heurVal,
    crossRefVal,
    config
  );
  
  // Determine confidence level
  const confidenceLevel = getConfidenceLevel(finalScore);
  
  // Collect flags
  const flags = collectFlags(llmVal, ruleVal, heurVal, crossRefVal, config);
  
  // Build final validation layer
  const validation: AgentValidationLayer = {
    validation_id: validationId,
    evidence_item_id: evidence.evidence_id,
    
    validations: {
      llm_validation: llmVal || undefined,
      rule_validation: ruleVal || undefined,
      heuristic_validation: heurVal || undefined,
      cross_reference: crossRefVal || undefined,
    },
    
    final_validation: {
      overall_confidence: confidenceLevel,
      validation_score: finalScore,
      approved,
      flags,
      reviewer_notes: generateReviewerNotes(llmVal, ruleVal, heurVal, crossRefVal, flags),
      timestamp: new Date().toISOString(),
      validated_by: 'agent:validation-layer-v1.0',
    },
  };
  
  return validation;
}

// =====================================================
// SCORE COMPUTATION
// =====================================================

/**
 * Compute final validation score from all methods
 * 
 * @returns Final score (0-100) and approval recommendation
 */
function computeFinalScore(
  llmVal: LLMValidation | null,
  ruleVal: RuleValidation | null,
  heurVal: HeuristicValidation | null,
  crossRefVal: CrossReferenceValidation | null,
  config: ValidationConfig
): { finalScore: number; approved: boolean } {
  const weights = config.weights || DEFAULT_CONFIG.weights!;
  let totalScore = 0;
  let totalWeight = 0;
  
  // Collect scores
  if (llmVal) {
    totalScore += llmVal.confidence_score * weights.llm_weight;
    totalWeight += weights.llm_weight;
  }
  
  if (ruleVal) {
    // Use rule overall_score (0-100)
    totalScore += ruleVal.overall_score * weights.rule_weight;
    totalWeight += weights.rule_weight;
  }
  
  if (heurVal) {
    // Convert overall_anomaly_score (0-100) to confidence
    // High anomaly = low confidence
    const confidenceFromHeuristic = 100 - heurVal.overall_anomaly_score;
    totalScore += confidenceFromHeuristic * weights.heuristic_weight;
    totalWeight += weights.heuristic_weight;
  }
  
  if (crossRefVal) {
    // Use agreement_score (0-100)
    totalScore += crossRefVal.agreement_score * weights.cross_reference_weight;
    totalWeight += weights.cross_reference_weight;
  }
  
  // Compute weighted average
  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50; // Default to 50 if no validations
  
  // Determine if approved
  const approved = finalScore >= config.confidence_threshold && !hasFailingChecks(llmVal, ruleVal);
  
  return {
    finalScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    approved,
  };
}

/**
 * Check if any validations have uncorrectable failures
 */
function hasFailingChecks(
  llmVal: LLMValidation | null,
  ruleVal: RuleValidation | null
): boolean {
  // LLM flags with \"error\" severity
  if (llmVal?.flags?.some((flag) => flag.severity === 'error')) {
    return true;
  }
  
  // Rules with failures (not just warnings)
  if (ruleVal) {
    const failedRules = ruleVal.rules_applied.filter((r) => !r.passed && !r.is_warning);
    if (failedRules.length > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get confidence level string
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

// =====================================================
// FLAG COLLECTION
// =====================================================

/**
 * Collect all flags from validation methods
 */
function collectFlags(
  llmVal: LLMValidation | null,
  ruleVal: RuleValidation | null,
  heurVal: HeuristicValidation | null,
  crossRefVal: CrossReferenceValidation | null,
  config: ValidationConfig
): string[] {
  const flags: string[] = [];
  
  // LLM flags
  if (llmVal?.flags?.length) {
    flags.push(
      ...llmVal.flags.map((f) => `llm_${f.severity}_${f.type}`)
    );
  }
  
  // Rule failures
  if (ruleVal?.summary.failed) {
    flags.push(
      ...ruleVal.rules_applied
        .filter((r) => !r.passed)
        .map((r) => `rule_failed_${r.rule_id}`)
    );
  }
  
  // Anomalies
  if (heurVal && heurVal.summary.is_anomaly) {
    flags.push('anomaly_detected');
    flags.push(`anomaly_level_${heurVal.summary.anomaly_level}`);
    flags.push(`anomaly_score_${Math.round(heurVal.overall_anomaly_score)}`);
  }
  
  // Cross-reference conflicts
  if (crossRefVal?.summary.conflicts?.length) {
    flags.push(
      ...crossRefVal.summary.conflicts.map(
        (c) => `conflict_with_${c.source.split(':')[0] || 'unknown'}`
      )
    );
  }
  
  // Config-based flags
  if (!config.enable_llm) flags.push('llm_validation_disabled');
  if (!config.enable_rules) flags.push('rule_validation_disabled');
  if (!config.enable_heuristics) flags.push('heuristic_validation_disabled');
  
  return flags;
}

// =====================================================
// REVIEWER NOTES GENERATION
// =====================================================

/**
 * Generate human-readable reviewer notes
 */
function generateReviewerNotes(
  llmVal: LLMValidation | null,
  ruleVal: RuleValidation | null,
  heurVal: HeuristicValidation | null,
  crossRefVal: CrossReferenceValidation | null,
  flags: string[]
): string {
  const parts: string[] = [];
  
  // LLM summary
  if (llmVal) {
    parts.push(
      `LLM (${llmVal.model}) analysis: ${llmVal.reasoning}`
    );
  }
  
  // Rule summary
  if (ruleVal) {
    const { passed, failed, warnings } = ruleVal.summary;
    parts.push(
      `Rules: ${passed} passed, ${failed} failed, ${warnings} warnings`
    );
  }
  
  // Heuristic summary
  if (heurVal) {
    parts.push(
      `Heuristics: Anomaly level=${heurVal.summary.anomaly_level}, ` +
      `Score=${heurVal.overall_anomaly_score}/100, ` +
      `Is anomaly=${heurVal.summary.is_anomaly}`
    );
  }
  
  // Cross-reference summary
  if (crossRefVal) {
    parts.push(
      `Cross-reference: Agreement score=${crossRefVal.agreement_score}, ` +
      `Checked ${crossRefVal.summary.related_evidence_count} sources, ` +
      `${crossRefVal.summary.conflict_sources} conflicts`
    );
  }
  
  // Flags
  if (flags.length > 0) {
    parts.push(`Flags: ${flags.join(', ')}`);
  }
  
  return parts.join(' | ');
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique validation ID
 */
function generateValidationId(evidenceId: string): string {
  return `val_${evidenceId.substring(0, 8)}_${Date.now()}`;
}

/**
 * Batch validate multiple evidence items
 * 
 * @param items - Array of evidence items
 * @param config - Validation configuration
 * @returns Array of validation results
 */
export async function validateEvidenceBatch(
  items: InstitutionalEvidenceItem[],
  config: ValidationConfig = DEFAULT_CONFIG
): Promise<AgentValidationLayer[]> {
  return Promise.all(
    items.map((item) =>
      validateEvidence(
        { evidence_item: item },
        config
      )
    )
  );
}

/**
 * Get validation statistics
 */
export function getValidationStats(
  validations: AgentValidationLayer[]
): {
  total: number;
  approved: number;
  rejected: number;
  average_score: number;
  confidence_distribution: { high: number; medium: number; low: number };
} {
  return {
    total: validations.length,
    approved: validations.filter((v) => v.final_validation.approved).length,
    rejected: validations.filter((v) => !v.final_validation.approved).length,
    average_score:
      Math.round(
        (validations.reduce((sum, v) => sum + v.final_validation.validation_score, 0) /
          validations.length) *
          10
      ) / 10,
    confidence_distribution: {
      high: validations.filter((v) => v.final_validation.overall_confidence === 'high').length,
      medium: validations.filter((v) => v.final_validation.overall_confidence === 'medium')
        .length,
      low: validations.filter((v) => v.final_validation.overall_confidence === 'low').length,
    },
  };
}

/**
 * Override validation decision (manual review)
 */
export function overrideValidation(
  validation: AgentValidationLayer,
  approved: boolean,
  reviewerNotes: string,
  reviewedBy: string
): AgentValidationLayer {
  return {
    ...validation,
    final_validation: {
      ...validation.final_validation,
      approved,
      reviewer_notes: `[MANUAL OVERRIDE] ${reviewerNotes} (overridden by ${reviewedBy})`,
      timestamp: new Date().toISOString(),
      validated_by: `manual:${reviewedBy}`,
    },
  };
}
