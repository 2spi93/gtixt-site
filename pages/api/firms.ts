import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '../../lib/rateLimit';
import { fetchJsonWithFallback, parseFallbackRoots } from '../../lib/fetchWithFallback';
import { logEvent } from '../../lib/logEvent';
import { alertMinIOFailure, alertStaleData } from '../../lib/alerting';

const LATEST_POINTER_URL =
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  'http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json';

const MINIO_PUBLIC_ROOT =
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
  'http://51.210.246.61:9000/gpti-snapshots/';

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
  score_0_100: number;
  confidence: number;
  na_rate?: number;
  jurisdiction?: string;
  jurisdiction_tier?: string;
  pillar_scores: Record<string, number>;
  agent_c_reasons: string[];
}

interface FirmsResponse {
  success: boolean;
  count: number;
  total: number;
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

/**
 * Normalize firm record from raw snapshot data
 */
function normalizeFirmRecord(raw: any): Partial<FirmRecord> {
  return {
    firm_id: raw.firm_id || raw.id,
    name: raw.firm_name || raw.name || raw.brand_name,
    website_root: raw.website_root || raw.website,
    model_type: raw.model_type,
    status: raw.status,
    score_0_100: typeof raw.score_0_100 === 'number' ? raw.score_0_100 : 0,
    confidence: normalizeConfidence(raw.confidence),
    na_rate: typeof raw.na_rate === 'number' ? raw.na_rate : undefined,
    jurisdiction: raw.jurisdiction,
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
    let snapshotInfo: any = null;
    let totalRecordsBeforeDedup = 0;

    const pointerUrls = [LATEST_POINTER_URL, ...FALLBACK_POINTER_URLS];
    const { data: latest, url: pointerUrl } = await fetchJsonWithFallback<any>(pointerUrls, { cache: 'no-store' });
    const snapshotRoots = [MINIO_PUBLIC_ROOT, ...FALLBACK_MINIO_ROOTS];
    const snapshotUrlCandidates = snapshotRoots.map((root) => `${root}${latest.object}`);

    // Fetch snapshot data
    const { data: snapshot, url: snapshotUrl } = await fetchJsonWithFallback<any>(snapshotUrlCandidates, { cache: 'no-store' });
    firms = (snapshot.records || [])
      .map((record: any) => normalizeFirmRecord(record) as FirmRecord)
      .filter((f): f is FirmRecord => !!f.firm_id);
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
