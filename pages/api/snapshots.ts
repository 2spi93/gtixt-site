import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '../../lib/rateLimit';
import { fetchJsonWithFallback, parseFallbackRoots } from '../../lib/fetchWithFallback';
import { logEvent } from '../../lib/logEvent';

const LATEST_POINTER_URL =
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  'https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json';

const FALLBACK_POINTER_URLS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_LATEST_POINTER_FALLBACKS
);

interface Snapshot {
  object: string;
  sha256: string;
  created_at: string;
  count: number;
  timestamp?: number; // Unix timestamp for sorting
}

interface SnapshotsResponse {
  success: boolean;
  snapshots: Snapshot[];
  total: number;
  latest?: Snapshot;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SnapshotsResponse | ErrorResponse>
) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 120, keyPrefix: 'snapshots' })) {
    return;
  }

  try {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    // Get query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const before = req.query.before as string | undefined;

    // Fetch latest pointer first
    const pointerUrls = [LATEST_POINTER_URL, ...FALLBACK_POINTER_URLS];
    const { data: latest, url: pointerUrl } = await fetchJsonWithFallback<any>(pointerUrls, { cache: 'no-store' });
    logEvent('info', 'snapshots.latest', { pointerUrl });

    // Convert ISO timestamp to unix timestamp
    const latestTimestamp = new Date(latest.created_at).getTime();
    const beforeTimestamp = before 
      ? new Date(before).getTime() 
      : latestTimestamp;

    // Without MinIO list API or a DB index, return latest only.
    const snapshots: Snapshot[] = [
      {
        object: latest.object,
        sha256: latest.sha256,
        created_at: latest.created_at,
        count: latest.count,
        timestamp: latestTimestamp,
      },
    ];

    // Filter by date if 'before' is specified
    let filtered = snapshots.filter(s => s.timestamp <= beforeTimestamp);

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Apply limit
    const result = filtered.slice(0, limit);

    res.status(200).json({
      success: true,
      snapshots: result,
      total: snapshots.length,
      latest,
    });
  } catch (error) {
    console.error('Snapshots API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
