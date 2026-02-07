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
 */
export const normalizeScore = (value: unknown): number | undefined => {
  const numeric = parseNumber(value);
  if (numeric === undefined) return undefined;
  
  // Value is already in 0-100 range
  if (numeric >= 0 && numeric <= 100) {
    return Math.round(numeric * 100) / 100;
  }
  
  // Value is in decimal 0-1 range, convert to percentage
  if (numeric > 0 && numeric <= 1) {
    return Math.round(numeric * 10000) / 100;
  }
  
  // Invalid range
  return undefined;
};

/**
 * Normalize N/A rate to percentage (0-100)
 * Handles both decimal (0-1) and percentage (0-100) inputs
 */
export const normalizeNaRate = (value: unknown): number | undefined => {
  const numeric = parseNumber(value);
  if (numeric === undefined) return undefined;
  
  // Already a percentage (0-100)
  if (numeric > 1 || (numeric >= 0 && numeric <= 100)) {
    return Math.round(numeric * 100) / 100;
  }
  
  // Decimal 0-1, convert to percentage
  if (numeric > 0 && numeric <= 1) {
    return Math.round(numeric * 10000) / 100;
  }
  
  return undefined;
};

/**
 * Normalize confidence to numeric 0-1 range
 * Handles both percentage (0-100) and decimal (0-1) inputs, plus string labels
 */
export const normalizeConfidence = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    if (value > 1) {
      // Convert from percentage to decimal
      return Math.round((value / 100) * 10000) / 10000;
    }
    if (value >= 0 && value <= 1) {
      return value;
    }
    return undefined;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    
    // String labels
    if (trimmed === 'high') return 0.9;
    if (trimmed === 'medium') return 0.75;
    if (trimmed === 'low') return 0.6;
    
    // Try to parse as number
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
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
