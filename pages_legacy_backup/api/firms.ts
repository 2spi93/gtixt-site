import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '../../lib/rateLimit';
import { inferJurisdictionFromUrl, normalizeScore, parseNumber } from '../../lib/dataUtils';
import { fetchJsonWithFallback, parseFallbackRoots } from '../../lib/fetchWithFallback';
import { logEvent } from '../../lib/logEvent';
import { alertMinIOFailure, alertStaleData } from '../../lib/alerting';
import fs from 'fs';
import path from 'path';

// Unified MinIO endpoint - prefer internal root for server-side fetches
const MINIO_BASE_URL = (
  process.env.MINIO_INTERNAL_ROOT ||
  process.env.NEXT_PUBLIC_MINIO_BASE ||
  'http://localhost:9002/gpti-snapshots'
).replace(/\/+$/, '');
const LATEST_POINTER_URL =
  process.env.SNAPSHOT_LATEST_URL ||
  `${MINIO_BASE_URL}/universe_v0.1_public/_public/latest.json`;

const MINIO_PUBLIC_ROOT = MINIO_BASE_URL + '/';

const FALLBACK_POINTER_URLS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_LATEST_POINTER_FALLBACKS
);

const FALLBACK_MINIO_ROOTS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_MINIO_FALLBACK_ROOTS
);

interface FirmRecord {
  firm_id: string;
  name: string;
  website_root: string;
  model_type: string;
  status: string;
  gtixt_status?: string;
  score_0_100: number;
  confidence: number;
  data_completeness?: number;
  data_badge?: string;
  na_rate?: number;
  jurisdiction?: string;
  jurisdiction_tier?: string;
  pillar_scores: Record<string, number>;
  agent_c_reasons: string[];
}

interface ExcludedFirm {
  firm_id?: string;
  name?: string;
  status?: string;
  gtixt_status?: string;
  jurisdiction?: string;
  reason: 'missing_id' | 'non_firm_id' | 'placeholder' | 'excluded_status';
}

let overridesCache: Record<string, Partial<FirmRecord>> | null = null;

const readOverridesFile = (fileName: string): Record<string, Partial<FirmRecord>> => {
  try {
    const filePath = path.join(process.cwd(), 'data', fileName);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, Partial<FirmRecord>>;
    const cleaned: Record<string, Partial<FirmRecord>> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith('_')) continue;
      cleaned[key.toLowerCase()] = value;
    }
    return cleaned;
  } catch {
    return {};
  }
};

const loadOverrides = (): Record<string, Partial<FirmRecord>> => {
  if (overridesCache) return overridesCache;
  const autoOverrides = readOverridesFile('firm-overrides.auto.json');
  const manualOverrides = readOverridesFile('firm-overrides.json');
  overridesCache = { ...autoOverrides, ...manualOverrides };
  return overridesCache;
};

const applyOverrides = (record: FirmRecord, overrides: Record<string, Partial<FirmRecord>>): FirmRecord => {
  const firmId = (record.firm_id || '').toLowerCase();
  if (!firmId) return record;
  const override = overrides[firmId];
  if (!override) return record;
  return { ...record, ...override };
};

const isPlaceholderFirm = (record: FirmRecord): boolean => {
  const name = (record.name || '').toString();
  const firmId = (record.firm_id || '').toString();
  return /^placeholder_/i.test(name) || /^placeholder_/i.test(firmId);
};

interface FirmsResponse {
  success: boolean;
  count: number;
  total: number;
  total_all: number;
  excluded_count: number;
  excluded_firms: ExcludedFirm[];
  limit: number;
  offset: number;
  firms: FirmRecord[];
  snapshot_info?: {
    object: string;
    sha256?: string;
    created_at: string;
    source: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

const INDEX_EXCLUDED_STATUSES = new Set([
  'controversial',
  'exclude',
  'excluded',
  'banned',
  'blacklist',
  'blacklisted',
  'do_not_index',
  'do-not-index'
]);

const NON_FIRM_IDS = new Set([
  'asset-management',
  'authorisation',
  'authorised-or-registered-institutions-persons-and-products',
  'banks-and-securities-firms',
  'contact',
  'documents',
  'getting-authorised',
  'home',
  'insurance-intermediaries',
  'insurers',
  'jobs',
  'media',
  'news',
  'portfolio-managers-and-trustees',
  'supervisory-organisations',
  'types-of-authorisation'
]);

const KEY_FIELDS = [
  'account_size_usd',
  'max_total_drawdown_pct',
  'max_daily_drawdown_pct',
  'payout_frequency',
  'payout_split_pct',
  'jurisdiction',
  'rules_extracted_v0',
  'pricing_extracted_v0',
  'founded_year',
];

/**
 * Normalize confidence string to number (0-1 range)
 */
function normalizeConfidence(value?: string | number): number {
  if (typeof value === 'number') {
    return value > 1 ? value / 100 : value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'high') return 0.9;
    if (lower === 'medium') return 0.75;
    if (lower === 'low') return 0.6;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric > 1 ? numeric / 100 : numeric;
  }
  return 0.75; // Default to medium
}

function normalizeCompleteness(value?: number | string): number | undefined {
  const parsed = parseNumber(value);
  if (parsed === undefined) return undefined;
  return parsed > 1 ? parsed / 100 : parsed;
}

function computeCompletenessFromData(raw: any): number | undefined {
  const data = raw?.data || raw?.datapoints;
  if (!data || typeof data !== 'object') return undefined;
  let present = 0;
  for (const key of KEY_FIELDS) {
    const field = data[key];
    if (!field) continue;
    if (typeof field === 'object') {
      if (field.value_text || field.value_json) {
        present += 1;
      }
    } else {
      present += 1;
    }
  }
  return present / KEY_FIELDS.length;
}

function isIndexExcluded(record: FirmRecord): boolean {
  const status = (record.status || '').toString().toLowerCase().trim();
  const gtixtStatus = (record.gtixt_status || '').toString().toLowerCase().trim();
  return INDEX_EXCLUDED_STATUSES.has(status) || INDEX_EXCLUDED_STATUSES.has(gtixtStatus);
}

function isNonFirmId(record: FirmRecord): boolean {
  const firmId = (record.firm_id || '').toString().toLowerCase().trim();
  return NON_FIRM_IDS.has(firmId);
}

/**
 * Normalize firm record from raw snapshot data
 */
function normalizeFirmRecord(raw: any): Partial<FirmRecord> {
  const websiteRoot = raw.website_root || raw.website;
  const inferredJurisdiction = inferJurisdictionFromUrl(websiteRoot);
  const parsedNaRate = parseNumber(raw.na_rate);
  const parsedCompleteness = normalizeCompleteness(raw.data_completeness);
  const derivedCompleteness = computeCompletenessFromData(raw);
  const naRateFromParsed = parsedNaRate !== undefined
    ? parsedNaRate > 1
      ? parsedNaRate / 100
      : parsedNaRate
    : undefined;
  const resolvedCompleteness = parsedCompleteness ?? (naRateFromParsed !== undefined ? 1 - naRateFromParsed : undefined) ?? derivedCompleteness;
  const resolvedNaRate = parsedNaRate !== undefined
    ? parsedNaRate
    : typeof resolvedCompleteness === 'number'
    ? (1 - resolvedCompleteness) * 100
    : undefined;
  const rawJurisdiction = typeof raw.jurisdiction === 'string' ? raw.jurisdiction.trim() : '';
  const resolvedJurisdiction =
    (rawJurisdiction && rawJurisdiction.length <= 40 ? rawJurisdiction : undefined) ||
    inferredJurisdiction ||
    (typeof websiteRoot === 'string' && /\.(com|net|org|co)(\/|$)/i.test(websiteRoot)
      ? 'Global'
      : undefined);

  return {
    firm_id: raw.firm_id || raw.id,
    name: raw.firm_name || raw.name || raw.brand_name,
    website_root: websiteRoot,
    model_type: raw.model_type,
    status: raw.status,
    gtixt_status: raw.gtixt_status || raw.oversight_gate_verdict || raw.audit_verdict,
    score_0_100: normalizeScore(raw.score_0_100 ?? raw.score ?? raw.integrity_score) ?? (typeof resolvedCompleteness === 'number' ? Math.round(resolvedCompleteness * 1000) / 10 : 0),
    confidence: normalizeConfidence(raw.confidence),
    data_completeness: resolvedCompleteness,
    data_badge: raw.data_badge,
    na_rate: resolvedNaRate !== undefined ? resolvedNaRate : undefined,
    jurisdiction: resolvedJurisdiction,
    jurisdiction_tier: raw.jurisdiction_tier,
    pillar_scores: raw.pillar_scores || {},
    agent_c_reasons: raw.agent_c_reasons || [],
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FirmsResponse | ErrorResponse>
) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 120, keyPrefix: 'firms' })) {
    return;
  }

  try {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    // Get query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;
    const sort = (req.query.sort as string) || 'score'; // score, name, status

    let firms: FirmRecord[] = [];
    let excludedFirms: ExcludedFirm[] = [];
    let snapshotInfo: any = null;
    let totalRecordsBeforeDedup = 0;
    let totalRecordsAll = 0;

    const pointerUrls = [LATEST_POINTER_URL, ...FALLBACK_POINTER_URLS];
    const { data: latest, url: pointerUrl } = await fetchJsonWithFallback<any>(pointerUrls, { cache: 'no-store' });
    const snapshotRoots = [MINIO_PUBLIC_ROOT, ...FALLBACK_MINIO_ROOTS];
    const snapshotUrlCandidates = snapshotRoots.map((root) => `${root}${latest.object}`);

    // Fetch snapshot data
    const { data: snapshot, url: snapshotUrl } = await fetchJsonWithFallback<any>(snapshotUrlCandidates, { cache: 'no-store' });
    const overrides = loadOverrides();
    const normalizedRecords = (snapshot.records || [])
      .map((record: any) => normalizeFirmRecord(record) as FirmRecord)
      .map((record: FirmRecord) => applyOverrides(record, overrides));

    totalRecordsAll = normalizedRecords.length;

    const included: FirmRecord[] = [];
    const excluded: ExcludedFirm[] = [];
    let nonFirmCount = 0;

    normalizedRecords.forEach((record) => {
      if (!record.firm_id) {
        excluded.push({
          firm_id: record.firm_id,
          name: record.name,
          status: record.status,
          gtixt_status: record.gtixt_status,
          jurisdiction: record.jurisdiction,
          reason: 'missing_id',
        });
        return;
      }
      if (isNonFirmId(record)) {
        nonFirmCount += 1;
        return;
      }
      if (isPlaceholderFirm(record)) {
        excluded.push({
          firm_id: record.firm_id,
          name: record.name,
          status: record.status,
          gtixt_status: record.gtixt_status,
          jurisdiction: record.jurisdiction,
          reason: 'placeholder',
        });
        return;
      }
      if (isIndexExcluded(record)) {
        excluded.push({
          firm_id: record.firm_id,
          name: record.name,
          status: record.status,
          gtixt_status: record.gtixt_status,
          jurisdiction: record.jurisdiction,
          reason: 'excluded_status',
        });
        return;
      }
      included.push(record);
    });

    firms = included;
    excludedFirms = excluded;
    totalRecordsBeforeDedup = firms.length;
    snapshotInfo = {
      object: latest.object,
      sha256: latest.sha256,
      created_at: latest.created_at,
      source: 'remote',
    };
    logEvent('info', 'firms.snapshot.remote', {
      source: 'remote',
      pointerUrl,
      snapshotUrl,
      count: totalRecordsBeforeDedup,
    });

    // CRITICAL: Deduplicate firms by firm_id
    const uniqueFirmsMap = new Map<string, FirmRecord>();
    firms.forEach(firm => {
      const key = firm.firm_id || firm.name;
      // Keep the first occurrence (or you can implement priority logic)
      if (!uniqueFirmsMap.has(key)) {
        uniqueFirmsMap.set(key, firm);
      }
    });
    firms = Array.from(uniqueFirmsMap.values());
    
    logEvent('info', 'firms.dedup', {
      total: totalRecordsBeforeDedup,
      unique: firms.length,
    });

    // Sort firms
    if (sort === 'name') {
      firms.sort((a: FirmRecord, b: FirmRecord) => 
        a.name.localeCompare(b.name)
      );
    } else if (sort === 'status') {
      firms.sort((a: FirmRecord, b: FirmRecord) => 
        a.status.localeCompare(b.status)
      );
    } else {
      // Default: sort by score descending
      firms.sort((a: FirmRecord, b: FirmRecord) => 
        (b.score_0_100 || 0) - (a.score_0_100 || 0)
      );
    }

    // Apply pagination
    const total = firms.length;
    const paginatedFirms = firms.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      count: paginatedFirms.length,
      total,
      total_all: totalRecordsAll,
      excluded_count: excludedFirms.length,
      excluded_firms: excludedFirms.slice(0, 200),
      limit,
      offset,
      firms: paginatedFirms,
      snapshot_info: snapshotInfo,
    });
    
    // Check for stale data and alert if needed
    if (snapshotInfo?.created_at) {
      const dataAge = Date.now() - new Date(snapshotInfo.created_at).getTime();
      const maxAge = 48 * 60 * 60 * 1000; // 48 hours
      if (dataAge > maxAge) {
        try {
          await alertStaleData(dataAge, maxAge);
        } catch (alertError) {
          // Ignore alerting errors
        }
      }
    }
  } catch (error) {
    console.error('Firms API error:', error);
    
    // Send Slack alert on complete failure
    try {
      await alertMinIOFailure('gpti-snapshots', (error as Error)?.message || 'Unknown error');
    } catch (alertError) {
      // Ignore alerting errors
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
