/**
 * GTIXT Rule Validator
 * 
 * Deterministic rule-based validation using business rules
 * Rules are versioned and can be updated without code changes
 * 
 * @module lib/validation/rule-validator
 * @version 1.0.0
 */

import type { InstitutionalEvidenceItem, RuleValidation } from '../institutional-data-models';

// =====================================================
// RULE TYPES
// =====================================================

interface Rule {
  rule_id: string;
  rule_name: string;
  rule_version: string;
  applies_to: string[]; // Evidence types this rule applies to
  check: (evidence: InstitutionalEvidenceItem) => boolean;
  score_impact: number; // -10 to +10
  is_warning: boolean; // If true, failure is warning not error
  error_message: string;
}

interface RuleCheckResult {
  rule_id: string;
  rule_name: string;
  rule_version: string;
  passed: boolean;
  score_impact: number;
  details: string;
  is_warning: boolean;
}

// =====================================================
// RULE DEFINITIONS
// =====================================================

const VALIDATION_RULES: Rule[] = [
  // Source authenticity rules
  {
    rule_id: 'r_source_official',
    rule_name: 'Source is official/credible',
    rule_version: '1.0',
    applies_to: ['regulatory_filing', 'press_release', 'news_article'],
    check: (evidence) => {
      const officialSources = [
        'sec.gov',
        'finra.org',
        'sec.report',
        'marketwatch.com',
        'reuters.com',
        'bloomberg.com',
      ];
      return officialSources.some((source) => evidence.source.includes(source));
    },
    score_impact: 2,
    is_warning: false,
    error_message: 'Source is not official or credible',
  },

  {
    rule_id: 'r_source_not_expired',
    rule_name: 'Source information is not expired',
    rule_version: '1.0',
    applies_to: ['regulatory_filing', 'company_website', 'job_posting'],
    check: (evidence) => {
      const extractionDate = new Date(evidence.provenance.extraction_timestamp);
      const now = new Date();
      const daysSince = (now.getTime() - extractionDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 365; // Data must be less than 1 year old
    },
    score_impact: -1,
    is_warning: true,
    error_message: 'Source information is older than 1 year',
  },

  // Data quality rules
  {
    rule_id: 'r_description_length',
    rule_name: 'Description has minimum length',
    rule_version: '1.0',
    applies_to: ['*'], // Applies to all types
    check: (evidence) => evidence.description.length >= 20,
    score_impact: 0,
    is_warning: false,
    error_message: 'Description is too short (minimum 20 characters)',
  },

  {
    rule_id: 'r_extraction_date_valid',
    rule_name: 'Extraction date is valid and not in future',
    rule_version: '1.0',
    applies_to: ['*'],
    check: (evidence) => {
      const extractionDate = new Date(evidence.provenance.extraction_timestamp);
      const now = new Date();
      // Date must be in past
      return extractionDate <= now && extractionDate.getFullYear() >= 1990;
    },
    score_impact: 0,
    is_warning: false,
    error_message: 'Extraction date is invalid',
  },

  // Confidence level rules
  {
    rule_id: 'r_confidence_consistency',
    rule_name: 'Confidence level is consistent with impact score',
    rule_version: '1.0',
    applies_to: ['*'],
    check: (evidence) => {
      if (evidence.confidence === 'high' && Math.abs(evidence.value ?? 0) > 5) {
        return true; // High confidence can have large impact
      }
      if (evidence.confidence === 'medium' && Math.abs(evidence.value ?? 0) <= 5) {
        return true; // Medium confidence with moderate impact is OK
      }
      if (evidence.confidence === 'low' && Math.abs(evidence.value ?? 0) <= 2) {
        return true; // Low confidence with small impact is OK
      }
      return false;
    },
    score_impact: 0,
    is_warning: true,
    error_message: 'Confidence level is not consistent with impact score',
  },

  // Provenance rules
  {
    rule_id: 'r_provenance_complete',
    rule_name: 'Provenance chain is complete',
    rule_version: '1.0',
    applies_to: ['*'],
    check: (evidence) => {
      return (
        evidence.provenance.transformation_chain &&
        evidence.provenance.transformation_chain.length > 0 &&
        Boolean(evidence.provenance.raw_data_hash) &&
        Boolean(evidence.provenance.raw_data_archive_url)
      );
    },
    score_impact: 1,
    is_warning: true,
    error_message: 'Provenance chain is incomplete',
  },

  // Impact score rules
  {
    rule_id: 'r_impact_in_range',
    rule_name: 'Impact score is in valid range',
    rule_version: '1.0',
    applies_to: ['*'],
    check: (evidence) => {
      const impact = evidence.value ?? 0;
      return impact >= -10 && impact <= 10;
    },
    score_impact: 0,
    is_warning: false,
    error_message: 'Impact score is outside valid range (-10 to +10)',
  },

  // Type-specific rules
  {
    rule_id: 'r_regulatory_filing_format',
    rule_name: 'Regulatory filing has recognizable format',
    rule_version: '1.0',
    applies_to: ['regulatory_filing'],
    check: (evidence) => {
      const formats = ['10-K', '10-Q', '8-K', 'S-1', 'DEF 14A'];
      return formats.some((fmt) => evidence.description.includes(fmt));
    },
    score_impact: 0,
    is_warning: true,
    error_message: 'Regulatory filing format not recognized',
  },
];

// =====================================================
// RULE VALIDATION
// =====================================================

/**
 * Validate evidence against all applicable rules
 * 
 * @param evidence - Evidence item to validate
 * @param pillarId - Optional pillar ID for context-specific validation
 * @returns Rule validation result
 */
export function validateWithRules(
  evidence: InstitutionalEvidenceItem,
  pillarId?: string
): RuleValidation {
  const appliedRules = getApplicableRules(evidence);
  const results: RuleCheckResult[] = [];
  
  // Run each applicable rule
  for (const rule of appliedRules) {
    try {
      const passed = rule.check(evidence);
      results.push({
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        rule_version: rule.rule_version,
        passed,
        score_impact: passed ? rule.score_impact : -Math.abs(rule.score_impact),
        details: passed
          ? `Rule '${rule.rule_name}' passed`
          : rule.error_message,
        is_warning: rule.is_warning,
      });
    } catch (error: any) {
      // Rule check threw an error
      results.push({
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        rule_version: rule.rule_version,
        passed: false,
        score_impact: -5,
        details: `Rule check failed: ${error.message}`,
        is_warning: true,
      });
    }
  }
  
  // Calculate summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && !r.is_warning).length;
  const warnings = results.filter((r) => !r.passed && r.is_warning).length;
  
  // Calculate overall score (impact of all rules)
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      50 + results.reduce((sum, r) => sum + (r.passed ? r.score_impact : 0), 0)
    )
  );
  
  return {
    rules_applied: results,
    overall_score: overallScore,
    summary: {
      total_rules: appliedRules.length,
      passed,
      failed,
      warnings,
    },
  };
}

// =====================================================
// RULE MANAGEMENT
// =====================================================

/**
 * Get rules applicable to an evidence item
 */
function getApplicableRules(evidence: InstitutionalEvidenceItem): Rule[] {
  return VALIDATION_RULES.filter((rule) => {
    return (
      rule.applies_to.includes('*') ||
      rule.applies_to.includes(evidence.type)
    );
  });
}

/**
 * Get all available rules
 */
export function getAllRules(): Rule[] {
  return VALIDATION_RULES;
}

/**
 * Add custom rule (for client-specific validation)
 */
export function addRule(rule: Rule): void {
  if (!VALIDATION_RULES.find((r) => r.rule_id === rule.rule_id)) {
    VALIDATION_RULES.push(rule);
  }
}

/**
 * Remove rule by ID
 */
export function removeRule(ruleId: string): boolean {
  const index = VALIDATION_RULES.findIndex((r) => r.rule_id === ruleId);
  if (index >= 0) {
    VALIDATION_RULES.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Get rule statistics
 */
export function getRuleStats(): {
  total_rules: number;
  by_version: Record<string, number>;
  by_evidence_type: Record<string, string[]>;
} {
  return {
    total_rules: VALIDATION_RULES.length,
    by_version: VALIDATION_RULES.reduce(
      (acc, rule) => {
        acc[rule.rule_version] = (acc[rule.rule_version] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    by_evidence_type: VALIDATION_RULES.reduce(
      (acc, rule) => {
        for (const type of rule.applies_to) {
          if (!acc[type]) acc[type] = [];
          acc[type].push(rule.rule_id);
        }
        return acc;
      },
      {} as Record<string, string[]>
    ),
  };
}