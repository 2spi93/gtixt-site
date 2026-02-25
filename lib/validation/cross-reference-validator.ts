/**
 * GTIXT Cross-Reference Validator
 * 
 * Multi-source consistency validation
 * Checks evidence against related items to detect conflicts and inconsistencies
 * 
 * @module lib/validation/cross-reference-validator
 * @version 1.0.0
 */

import type { InstitutionalEvidenceItem, CrossReferenceValidation } from '../institutional-data-models';

// =====================================================
// CROSS-REFERENCE TYPES
// =====================================================

interface RelatedEvidence {
  evidence_id: string;
  source: string;
  description: string;
  impact_on_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  extraction_date: string;
}

interface ConsistencyResult {
  related_evidence_id: string;
  source: string;
  consistency_type: 'agreement' | 'neutral' | 'conflict';
  consistency_score: number; // 0-100, 100 = perfect agreement
  details: string;
}

interface ConflictDetail {
  other_evidence_id: string;
  other_source: string;
  conflict_score: number; // 0-100, 100 = maximum conflict
  conflict_description: string;
}

// =====================================================
// CONSISTENCY CHECKING
// =====================================================

/**
 * Check if two pieces of evidence agree or conflict
 * Based on: impact direction, confidence level, temporal proximity
 */
function checkConsistency(
  evidence: InstitutionalEvidenceItem,
  related: RelatedEvidence
): ConsistencyResult {
  let consistencyScore = 50; // Neutral baseline
  let consistency_type: 'agreement' | 'neutral' | 'conflict' = 'neutral';
  let details = '';
  
  // Check 1: Impact direction agreement
  const mainValue = evidence.value ?? 0;
  const mainDirection = mainValue > 0 ? 'positive' : 'negative';
  const relatedDirection = related.impact_on_score > 0 ? 'positive' : 'negative';
  
  if (mainDirection === relatedDirection) {
    consistencyScore += 20; // Agreement on direction
    consistency_type = 'agreement';
    details += `Impact direction agreement (${mainDirection}). `;
  } else if (mainDirection !== relatedDirection) {
    consistencyScore -= 25; // Clear conflict
    consistency_type = 'conflict';
    details += `Impact direction conflict (${mainDirection} vs ${relatedDirection}). `;
  }
  
  // Check 2: Magnitude similarity
  const mainMagnitude = Math.abs(mainValue);
  const relatedMagnitude = Math.abs(related.impact_on_score);
  const magnitudeDiff = Math.abs(mainMagnitude - relatedMagnitude);
  
  if (magnitudeDiff <= 1) {
    consistencyScore += 15; // Very similar magnitudes
    details += `Magnitudes similar (${mainMagnitude} vs ${relatedMagnitude}). `;
  } else if (magnitudeDiff <= 3) {
    consistencyScore += 5; // Moderately similar
    details += `Magnitudes moderately similar (${mainMagnitude} vs ${relatedMagnitude}). `;
  } else {
    consistencyScore -= 10; // Different magnitudes
    details += `Magnitudes differ (${mainMagnitude} vs ${relatedMagnitude}). `;
  }
  
  // Check 3: Confidence level agreement
  const confidenceMap = { high: 3, medium: 2, low: 1 };
  const mainConfidence = confidenceMap[evidence.confidence as 'high' | 'medium' | 'low'] ?? 2;
  const relatedConfidence = confidenceMap[related.confidence_level];
  
  if (mainConfidence === relatedConfidence) {
    consistencyScore += 10;
  } else if (Math.abs(mainConfidence - relatedConfidence) <= 1) {
    consistencyScore += 5;
  }
  
  // Check 4: Temporal proximity
  const mainDate = new Date(evidence.provenance.extraction_timestamp);
  const relatedDate = new Date(related.extraction_date);
  const daysDiff = Math.abs((mainDate.getTime() - relatedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) {
    consistencyScore += 10; // Same day or next day
    details += `Temporal proximity: same period. `;
  } else if (daysDiff <= 30) {
    consistencyScore += 5; // Within month
    details += `Temporal proximity: within month. `;
  } else if (daysDiff > 180) {
    consistencyScore -= 5; // Very different time periods
    details += `Temporal separation: ${Math.round(daysDiff)} days apart. `;
  }
  
  // Clamp to 0-100 range
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));
  
  return {
    related_evidence_id: related.evidence_id,
    source: related.source,
    consistency_type,
    consistency_score: consistencyScore,
    details: details.trim(),
  };
}

/**
 * Find conflicts with related evidence
 */
function findConflicts(
  evidence: InstitutionalEvidenceItem,
  relatedEvidence: RelatedEvidence[],
  consistencyResults: ConsistencyResult[]
): ConflictDetail[] {
  const conflicts: ConflictDetail[] = [];
  
  for (let i = 0; i < relatedEvidence.length; i++) {
    const result = consistencyResults[i];
    const related = relatedEvidence[i];
    
    // Conflict is opposite of consistency: 100 - score
    const conflictScore = result.consistency_type === 'conflict' ? 
      Math.round(100 - result.consistency_score) : 0;
    
    if (conflictScore > 30) {
      // Significant conflict detected
      const mainValue = evidence.value ?? 0;
      const mainDirection = mainValue > 0 ? '+' : '';
      const relatedDirection = related.impact_on_score > 0 ? '+' : '';
      
      conflicts.push({
        other_evidence_id: related.evidence_id,
        other_source: related.source,
        conflict_score: conflictScore,
        conflict_description: 
          `Evidence claims impact ${mainDirection}${mainValue.toFixed(1)} ` +
          `while ${related.source} claims ${relatedDirection}${related.impact_on_score.toFixed(1)}. ` +
          `Disagreement on impact direction and magnitude.`,
      });
    }
  }
  
  return conflicts;
}

/**
 * Compute inter-source agreement metric
 */
function computeAgreementMetric(consistencyResults: ConsistencyResult[]): number {
  if (consistencyResults.length === 0) return 50; // No data = neutral
  
  // Count agreement/conflict/neutral
  const agreements = consistencyResults.filter((r) => r.consistency_type === 'agreement').length;
  const conflicts = consistencyResults.filter((r) => r.consistency_type === 'conflict').length;
  
  // Agreement = 100 * (agreements / total)
  // Conflict lowers it: -50 * (conflicts / total)
  const baseScore = (agreements / consistencyResults.length) * 100;
  const conflictPenalty = (conflicts / consistencyResults.length) * 50;
  
  return Math.round(Math.max(0, baseScore - conflictPenalty));
}

// =====================================================
// CROSS-REFERENCE VALIDATION
// =====================================================

/**
 * Validate evidence against related/similar evidence
 * 
 * Requires related evidence to be passed in
 * In production, would query database for related evidence
 */
export function validateWithCrossReference(
  evidence: InstitutionalEvidenceItem,
  relatedEvidence: RelatedEvidence[] = []
): CrossReferenceValidation {
  // If no related evidence provided, return neutral validation
  if (relatedEvidence.length === 0) {
    return {
      consistency_checks: [],
      agreement_score: 50,
      summary: {
        related_evidence_count: 0,
        agreement_sources: 0,
        conflict_sources: 0,
        neutral_sources: 0,
        conflicts: [],
      },
    };
  }
  
  // Run consistency checks
  const consistencyChecks = relatedEvidence.map((related) =>
    checkConsistency(evidence, related)
  );
  
  // Find conflicts
  const conflicts = findConflicts(evidence, relatedEvidence, consistencyChecks);
  
  // Count by consistency type
  const agreements = consistencyChecks.filter((c) => c.consistency_type === 'agreement').length;
  const conflictsCount = consistencyChecks.filter((c) => c.consistency_type === 'conflict').length;
  const neutrals = consistencyChecks.filter((c) => c.consistency_type === 'neutral').length;
  
  // Compute agreement metric
  const agreementScore = computeAgreementMetric(consistencyChecks);
  
  // Map to expected format
  const mappedChecks = consistencyChecks.map((check) => ({
    related_source: check.source,
    consistency_type: check.consistency_type,
    similarity_score: check.consistency_score,
    details: check.details,
  }));
  
  // Map conflicts to expected format
  const mappedConflicts = conflicts.map((conflict) => ({
    source: conflict.other_source,
    conflict_type: 'disagreement',
    severity: (conflict.conflict_score > 70 ? 'high' : conflict.conflict_score > 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    details: conflict.conflict_description,
  }));
  
  return {
    consistency_checks: mappedChecks,
    agreement_score: agreementScore,
    summary: {
      related_evidence_count: relatedEvidence.length,
      agreement_sources: agreements,
      conflict_sources: conflictsCount,
      neutral_sources: neutrals,
      conflicts: mappedConflicts,
    },
  };
}

/**
 * Find evidence that mentions same company
 * Mock implementation - would query database in production
 */
export function findRelatedEvidence(
  evidence: InstitutionalEvidenceItem,
  searchDatabase: (query: any) => Promise<RelatedEvidence[]>
): Promise<RelatedEvidence[]> {
  // This would be called to find related evidence from database
  // For now, return mock data
  return Promise.resolve([]);
}

/**
 * Analyze inconsistencies across multiple sources
 * Returns structured report of conflicts
 */
export function analyzeInconsistencies(
  evidenceList: InstitutionalEvidenceItem[],
  relatedEvidenceMap: Map<string, RelatedEvidence[]>
): {
  total_evidence: number;
  evidence_with_conflicts: number;
  conflict_details: Array<{
    evidence_id: string;
    conflicts: Array<{
      source: string;
      conflict_type: string;
      severity: 'low' | 'medium' | 'high';
      details: string;
    }>;
  }>;
} {
  const conflictDetails: Array<{
    evidence_id: string;
    conflicts: Array<{
      source: string;
      conflict_type: string;
      severity: 'low' | 'medium' | 'high';
      details: string;
    }>;
  }> = [];
  
  for (const evidence of evidenceList) {
    const related = relatedEvidenceMap.get(evidence.evidence_id) || [];
    const validation = validateWithCrossReference(evidence, related);
    
    if (validation.summary.conflicts.length > 0) {
      conflictDetails.push({
        evidence_id: evidence.evidence_id,
        conflicts: validation.summary.conflicts,
      });
    }
  }
  
  return {
    total_evidence: evidenceList.length,
    evidence_with_conflicts: conflictDetails.length,
    conflict_details: conflictDetails,
  };
}

/**
 * Get cross-reference validation statistics
 */
export function getCrossRefStats(): {
  validation_version: string;
  checks_per_evidence: number;
  conflict_threshold: number;
  description: string;
} {
  return {
    validation_version: '1.0',
    checks_per_evidence: 8, // Number of cross-reference metrics
    conflict_threshold: 30, // Conflict score > 30 = reported
    description:
      'Validates evidence consistency across multiple sources. ' +
      'Checks impact direction, magnitude, confidence levels, and temporal alignment.',
  };
}