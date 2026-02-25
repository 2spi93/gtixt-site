/**
 * GTIXT Heuristic Validator
 * 
 * Machine learning heuristics for anomaly detection and pattern recognition
 * Uses statistical methods to detect suspicious patterns and inconsistencies
 * 
 * @module lib/validation/heuristic-validator
 * @version 1.0.0
 */

import type { InstitutionalEvidenceItem, HeuristicValidation } from '../institutional-data-models';

// =====================================================
// HEURISTIC TYPES
// =====================================================

interface AnomalyScore {
  name: string;
  score: number; // 0-100
  severity: 'low' | 'medium' | 'high'; // low: 0-30, medium: 30-70, high: 70-100
  description: string;
}

interface HeuristicCheckResult {
  check_id: string;
  check_name: string;
  is_anomaly: boolean;
  anomaly_score: number; // 0-100
  details: string;
}

// =====================================================
// HEURISTIC CHECKS
// =====================================================

/**
 * Check 1: Impact vs Confidence Correlation
 * High impact with low confidence = suspicious
 */
function checkImpactConfidenceAlignment(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const impact = Math.abs(evidence.value ?? 0);
  const confidenceMap = { high: 3, medium: 2, low: 1 };
  const confidence = confidenceMap[evidence.confidence];
  
  // Expected: high impact -> high confidence, low impact -> low confidence
  const expectedMinConfidence = impact > 5 ? 2 : 1;
  const mismatch = confidence < expectedMinConfidence ? (5 - impact + confidence) * 10 : 0;
  
  return {
    name: 'Impact-Confidence Alignment',
    score: Math.min(100, Math.max(0, mismatch)),
    severity:
      mismatch > 70 ? 'high' : mismatch > 30 ? 'medium' : 'low',
    description:
      mismatch > 0
        ? `High impact (${impact}) with low confidence (${evidence.confidence})`
        : 'Impact and confidence levels are well-aligned',
  };
}

/**
 * Check 2: Source Reliability Heuristic
 * URLs with suspicious patterns = potential manipulation
 */
function checkSourceReliability(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const url = evidence.source.toLowerCase();
  const redFlags = [
    'shortened-url',
    'bit.ly',
    'tinyurl',
    'jmp.click',
    'xn--',
    'localhost',
    '127.0.0.1',
    'test',
    'staging',
  ];
  
  let redFlagCount = 0;
  for (const flag of redFlags) {
    if (url.includes(flag)) redFlagCount++;
  }
  
  // URLs should be from established domains
  const knownGood = ['sec', 'finra', 'nasdaq', 'nyse', 'cnn', 'reuters', 'bloomberg'];
  const isKnownGood = knownGood.some((domain) => url.includes(domain));
  
  const score = redFlagCount * 20 + (isKnownGood ? 0 : 15);
  
  return {
    name: 'Source Reliability',
    score: Math.min(100, score),
    severity: score > 70 ? 'high' : score > 30 ? 'medium' : 'low',
    description:
      redFlagCount > 0
        ? `Source has ${redFlagCount} suspicious pattern(s)`
        : isKnownGood
          ? 'Source is from known reliable domain'
          : 'Source is from unknown domain',
  };
}

/**
 * Check 3: Extraction Method Confidence
 * Automated extraction lower confidence than manual
 */
function checkExtractionMethodConfidence(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const method = evidence.provenance.extraction_method || 'unknown';
  const confidence = evidence.confidence;
  
  // Heuristic: LLM extraction should have medium-high confidence, web scraping lower
  let anomaly = 0;
  
  if (method.includes('llm') && confidence === 'low') {
    anomaly = 40; // LLM should be more confident
  } else if (method.includes('regex') && confidence === 'high') {
    anomaly = 30; // Regex extraction is error-prone for high confidence
  } else if (method.includes('web_scrape') && confidence === 'high') {
    anomaly = 25; // Web scraping can be fragile
  }
  
  return {
    name: 'Extraction Method Confidence',
    score: anomaly,
    severity: anomaly > 70 ? 'high' : anomaly > 30 ? 'medium' : 'low',
    description:
      anomaly > 0
        ? `${method} extraction with ${confidence} confidence is unusual`
        : `${method} extraction confidence is well-calibrated`,
  };
}

/**
 * Check 4: Temporal Consistency
 * Evidence from old dates with high impact = suspicious
 */
function checkTemporalConsistency(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const extractionDate = new Date(evidence.provenance.extraction_timestamp);
  const now = new Date();
  const daysSince = (now.getTime() - extractionDate.getTime()) / (1000 * 60 * 60 * 24);
  const impact = Math.abs(evidence.value ?? 0);
  
  // Heuristic: Old evidence (> 6 months) should have lower impact
  const expectedMaxImpact = daysSince > 180 ? 3 : daysSince > 365 ? 1 : 10;
  const anomaly = impact > expectedMaxImpact ? (impact - expectedMaxImpact) * 15 : 0;
  
  return {
    name: 'Temporal Consistency',
    score: Math.min(100, anomaly),
    severity: anomaly > 70 ? 'high' : anomaly > 30 ? 'medium' : 'low',
    description:
      anomaly > 0
        ? `Old evidence (${Math.round(daysSince)} days) with high impact (${impact})`
        : `Evidence age (${Math.round(daysSince)} days) is consistent with impact`,
  };
}

/**
 * Check 5: Data Type Validation
 * Evidence type should match pillar
 */
function checkDataTypeValidation(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const validMappings: Record<string, string[]> = {
    revenue_details: ['regulatory_filing', 'press_release', 'financial_report'],
    executive_team: ['company_website', 'linkedin_profile', 'news_article'],
    regulatory_compliance: ['regulatory_filing', 'sec_filing', 'court_document'],
    customer_satisfaction: ['news_article', 'job_posting', 'company_website'],
    market_position: ['press_release', 'news_article', 'analyst_report'],
  };
  
  // InstitutionalEvidenceItem doesn't have pillar_id, so skip this check
  // This validation would need pillar context passed separately
  return {
    name: 'Data Type Validation',
    score: 0,
    severity: 'low',
    description: 'Pillar context not available for type validation',
  };
}

/**
 * Check 6: Claim Specificity
 * Too vague claims = lower confidence needed
 */
function checkClaimSpecificity(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const description = evidence.description.toLowerCase();
  const vagueTerms = ['might', 'could', 'possibly', 'may', 'allegedly', 'reportedly', 'seemingly'];
  const vaguenessCount = vagueTerms.filter((term) => description.includes(term)).length;
  
  // High confidence claims should be specific (few vague terms)
  const confidenceMap = { high: 0, medium: 1, low: 3 };
  const expectedMaxVagueness = confidenceMap[evidence.confidence];
  const anomaly = vaguenessCount > expectedMaxVagueness ? (vaguenessCount - expectedMaxVagueness) * 20 : 0;
  
  return {
    name: 'Claim Specificity',
    score: Math.min(100, anomaly),
    severity: anomaly > 70 ? 'high' : anomaly > 30 ? 'medium' : 'low',
    description:
      anomaly > 0
        ? `High confidence claim with ${vaguenessCount} vague terms`
        : `Claim specificity is appropriate for ${evidence.confidence} confidence`,
  };
}

/**
 * Check 7: Numerical Reasonableness
 * Impact scores should be reasonable for the evidence
 */
function checkNumericalReasonableness(evidence: InstitutionalEvidenceItem): AnomalyScore {
  const impact = Math.abs(evidence.value ?? 0);
  
  // Heuristic mapping: evidence type -> expected impact range
  const expectedRanges: Record<string, [number, number]> = {
    regulatory_filing: [2, 8],
    press_release: [1, 5],
    job_posting: [0.5, 3],
    news_article: [0.5, 4],
    company_website: [0.5, 2],
    analyst_report: [1, 6],
    court_document: [2, 8],
    default: [0.5, 5],
  };
  
  const [minExpected, maxExpected] = expectedRanges[evidence.type] || expectedRanges.default;
  
  const anomaly =
    impact < minExpected ? (minExpected - impact) * 15 :
    impact > maxExpected ? (impact - maxExpected) * 15 : 0;
  
  return {
    name: 'Numerical Reasonableness',
    score: Math.min(100, anomaly),
    severity: anomaly > 70 ? 'high' : anomaly > 30 ? 'medium' : 'low',
    description:
      anomaly > 0
        ? `Impact score ${impact} is unusual for ${evidence.type} (expected ${minExpected}-${maxExpected})`
        : `Impact score ${impact} is reasonable for ${evidence.type}`,
  };
}

// =====================================================
// HEURISTIC VALIDATION
// =====================================================

/**
 * Run all heuristic checks on evidence
 */
export function validateWithHeuristics(
  evidence: InstitutionalEvidenceItem
): HeuristicValidation {
  const checks: AnomalyScore[] = [
    checkImpactConfidenceAlignment(evidence),
    checkSourceReliability(evidence),
    checkExtractionMethodConfidence(evidence),
    checkTemporalConsistency(evidence),
    checkDataTypeValidation(evidence),
    checkClaimSpecificity(evidence),
    checkNumericalReasonableness(evidence),
  ];
  
  // Compute overall anomaly score (average of all checks)
  const overallAnomalyScore = Math.round(
    checks.reduce((sum, check) => sum + check.score, 0) / checks.length
  );
  
  // Count severity levels
  const severityCounts = {
    high: checks.filter((c) => c.severity === 'high').length,
    medium: checks.filter((c) => c.severity === 'medium').length,
    low: checks.filter((c) => c.severity === 'low').length,
  };
  
  // Determine if overall anomaly detected
  const isAnomaly = overallAnomalyScore > 50 || severityCounts.high > 2;
  
  return {
    anomaly_checks: checks,
    overall_anomaly_score: overallAnomalyScore,
    summary: {
      total_checks: checks.length,
      severity_counts: severityCounts,
      is_anomaly: isAnomaly,
      anomaly_level: isAnomaly
        ? overallAnomalyScore > 75
          ? 'high'
          : 'medium'
        : 'low',
    },
  };
}

/**
 * Get heuristic statistics
 */
export function getHeuristicStats(): {
  total_checks: number;
  check_names: string[];
} {
  return {
    total_checks: 7,
    check_names: [
      'Impact-Confidence Alignment',
      'Source Reliability',
      'Extraction Method Confidence',
      'Temporal Consistency',
      'Data Type Validation',
      'Claim Specificity',
      'Numerical Reasonableness',
    ],
  };
}
