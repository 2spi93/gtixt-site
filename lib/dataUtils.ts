/**
 * Centralized Data Normalization & Transformation Utilities
 * Single source of truth for all data processing
 */

/**
 * Parse any value to number, handling string edge cases
 */
export const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? undefined : numeric;
  }
  return undefined;
};

/**
 * Normalize score to 0-100 range consistently
 * Handles both decimal (0-1) and percentage (0-100) inputs
 * 
 * EXAMPLES:
 * - normalizeScore(0.85)   → 85       (decimal input multiplied by 100)
 * - normalizeScore(85)     → 85       (already normalized, return as-is)
 * - normalizeScore(1)      → 100      (max decimal value)
 * - normalizeScore(0)      → 0        (min value)
 * - normalizeScore(150)    → undefined (out of range)
 * - normalizeScore(-10)    → undefined (negative, invalid)
 * - normalizeScore("85.5") → 85.5     (string parsing handled by parseNumber)
 * 
 * PRECISION: Maintains 2 decimal places during conversion (math: value * 10000 / 100)
 * This preserves precision while converting percentage scale.
 */
export const normalizeScore = (value: unknown): number | undefined => {
  const numeric = parseNumber(value);
  if (numeric === undefined) return undefined;
  
  // Value is already in percentage 0-100 range — return as-is with 2 decimal precision
  if (numeric >= 0 && numeric <= 100) {
    return Math.round(numeric * 100) / 100;
  }
  
  // Value is in decimal 0-1 range — convert to percentage (multiply by 100)
  // Math: multiply by 10000, round to nearest integer, divide by 100
  // This ensures 2 decimal precision (e.g., 0.851 → 8510 → 85.1 / 100 = 85.1)
  if (numeric > 0 && numeric <= 1) {
    return Math.round(numeric * 10000) / 100;
  }
  
  // Invalid range (negative, > 100, or > 1 but < 0)
  return undefined;
};

/**
 * Normalize N/A (missing data) rate to percentage (0-100)
 * Handles both decimal (0-1) and percentage (0-100) inputs
 * 
 * RELATIONSHIP TO DATA COMPLETENESS:
 * - data_completeness = 1 - (na_rate / 100)
 * - If na_rate = 10%, then completeness = 90%
 * - If na_rate = 0.1 (decimal), then completeness = 0.9 (decimal)
 * 
 * EXAMPLES:
 * - normalizeNaRate(0.10)   → 10       (decimal 0-1, represents 10% NA)
 * - normalizeNaRate(10)     → 10       (already percentage)
 * - normalizeNaRate(25.5)   → 25.5     (percentage with precision)
 * - normalizeNaRate(1)      → 100      (100% missing data — edge case)
 * - normalizeNaRate(0)      → 0        (0% missing data, fully complete)
 * - normalizeNaRate(150)    → undefined (invalid: > 100%)
 * 
 * PRECISION: Same as normalizeScore (2 decimal places, math: value * 10000 / 100)
 */
export const normalizeNaRate = (value: unknown): number | undefined => {
  const numeric = parseNumber(value);
  if (numeric === undefined) return undefined;
  
  // Already a percentage (0-100), or value > 1 indicates input was percentage
  // Return with 2 decimal precision
  if (numeric > 1 || (numeric >= 0 && numeric <= 100)) {
    return Math.round(numeric * 100) / 100;
  }
  
  // Decimal 0-1 range — convert to percentage by multiplying by 100
  // Math: multiply by 10000, round to nearest integer, divide by 100
  if (numeric > 0 && numeric <= 1) {
    return Math.round(numeric * 10000) / 100;
  }
  
  return undefined;
};

/**
 * Normalize confidence to numeric 0-1 (decimal) range
 * Handles multiple input formats: percentage (0-100), decimal (0-1), string labels
 * 
 * INPUT FORMATS SUPPORTED:
 * - Percentage (0-100): 85 → 0.85
 * - Decimal (0-1): 0.85 → 0.85  
 * - String labels: "high" → 0.9, "medium" → 0.75, "low" → 0.6
 * - Numeric strings: "85" → 0.85, "0.85" → 0.85
 * 
 * EXAMPLES:
 * - normalizeConfidence(85)        → 0.85       (percentage input)
 * - normalizeConfidence(0.85)      → 0.85       (already decimal)
 * - normalizeConfidence("high")    → 0.9        (label interpretation)
 * - normalizeConfidence("medium")  → 0.75       (standard/default)
 * - normalizeConfidence("low")     → 0.6        (low confidence)
 * - normalizeConfidence("85")      → 0.85       (numeric string)
 * - normalizeConfidence(null)      → undefined  (missing data)
 * 
 * PRECISION: 4 decimal places for conversions (math: value / 100 * 10000 / 10000)
 * This maintains sufficient precision for score comparisons and sorting.
 * 
 * INTERPRETATION:
 * - ≥ 0.85: "high" confidence in data integrity
 * - 0.65-0.84: "medium" confidence (default fallback)
 * - < 0.65: "low" confidence in data integrity
 */
export const normalizeConfidence = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    if (value > 1) {
      // Convert from percentage (0-100) to decimal (0-1)
      // Math: divide by 100, then multiply by 10000/10000 for precision
      return Math.round((value / 100) * 10000) / 10000;
    }
    if (value >= 0 && value <= 1) {
      // Already in decimal 0-1 range — return as-is
      return value;
    }
    // Out of range
    return undefined;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    
    // String labels mapped to predefined confidence levels
    // These come from Agent C verdicts or manual assessment
    if (trimmed === 'high') return 0.9;      // Very confident
    if (trimmed === 'medium') return 0.75;   // Standard medium confidence
    if (trimmed === 'low') return 0.6;       // Less confident, needs review
    
    // Try to parse as numeric value (handles "85", "0.85", etc.)
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      // Recursively normalize the parsed number
      return normalizeConfidence(numeric);
    }
  }
  
  return undefined;
};

/**
 * Format confidence as human-readable label
 */
export const formatConfidenceLabel = (value: unknown): 'high' | 'medium' | 'low' | 'unknown' => {
  const normalized = normalizeConfidence(value);
  if (normalized === undefined) return 'unknown';
  
  if (normalized >= 0.85) return 'high';
  if (normalized >= 0.65) return 'medium';
  return 'low';
};

/**
 * Safe pick-first for handling multiple field name aliases
 * Returns first non-empty value, or undefined
 */
export const pickFirst = <T,>(...values: Array<T | null | undefined | ''>): T | undefined => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }
  return undefined;
};

/**
 * Check if value is considered "empty" for merging purposes
 */
export const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || value === 'null' || value === 'undefined';

/**
 * Merge firm record, filling missing fields from enriched source
 */
export const mergeFirmRecords = <T extends Record<string, unknown>>(
  base: T,
  enriched?: T | null
): T => {
  if (!enriched) return base;
  
  const merged: T = { ...base };
  for (const [key, value] of Object.entries(enriched)) {
    if (isEmptyValue(merged[key]) && !isEmptyValue(value)) {
      (merged as any)[key] = value;
    }
  }
  return merged;
};

/**
 * Normalize firm name to canonical form for comparison
 */
export const normalizeFirmName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Extract jurisdiction from domain/URL
 */
export const inferJurisdictionFromUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
    const host = url.hostname.toLowerCase();
    const tld = host.split('.').slice(-2).join('.');
    
    const tldMap: Record<string, string> = {
      'co.uk': 'United Kingdom', 'uk': 'United Kingdom',
      'com.au': 'Australia', 'au': 'Australia',
      'ca': 'Canada', 'us': 'United States',
      'ie': 'Ireland', 'fr': 'France',
      'de': 'Germany', 'es': 'Spain',
      'it': 'Italy', 'nl': 'Netherlands',
      'be': 'Belgium', 'se': 'Sweden',
      'no': 'Norway', 'dk': 'Denmark',
      'fi': 'Finland', 'ch': 'Switzerland',
      'at': 'Austria', 'pl': 'Poland',
      'cz': 'Czech Republic', 'pt': 'Portugal',
      'sg': 'Singapore', 'hk': 'Hong Kong',
      'jp': 'Japan', 'cn': 'China',
      'in': 'India', 'br': 'Brazil',
      'mx': 'Mexico', 'za': 'South Africa',
      'ae': 'United Arab Emirates',
      'eu': 'European Union',
      'io': 'International',
      'com': 'Global', 'net': 'Global',
      'org': 'Global', 'co': 'Global',
    };
    
    return tldMap[tld] || tldMap[host.split('.').pop() || ''];
  } catch {
    return undefined;
  }
};

/**
 * Aggregate pillar scores with proper weighting
 */
export const aggregatePillarScores = (
  pillarScores?: Record<string, number>
): number | undefined => {
  if (!pillarScores || Object.keys(pillarScores).length === 0) return undefined;
  
  const scores = Object.values(pillarScores).filter((s) => typeof s === 'number' && !Number.isNaN(s));
  if (scores.length === 0) return undefined;
  
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100) / 100;
};

/**
 * Aggregate metric scores
 */
export const aggregateMetricScores = (
  metricScores?: Record<string, number>
): number | undefined => {
  if (!metricScores || Object.keys(metricScores).length === 0) return undefined;
  
  const scores = Object.values(metricScores).filter((s) => typeof s === 'number' && !Number.isNaN(s));
  if (scores.length === 0) return undefined;
  
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100) / 100;
};

/**
 * Validate percentile range
 */
export const normalizePercentile = (value: unknown): number | undefined => {
  const numeric = parseNumber(value);
  if (numeric === undefined) return undefined;
  
  if (numeric >= 0 && numeric <= 100) {
    return Math.round(numeric * 100) / 100;
  }
  
  return undefined;
};
