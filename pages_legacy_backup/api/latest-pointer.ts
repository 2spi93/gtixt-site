import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '../../lib/rateLimit';
import { fetchJsonWithFallback, parseFallbackRoots } from '../../lib/fetchWithFallback';
import { logEvent } from '../../lib/logEvent';
import { alertMinIOFailure } from '../../lib/alerting';

interface LatestPointer {
  object: string;
  sha256?: string;
  created_at: string;
  count?: number;
  source: 'remote';
}

interface ErrorResponse {
  success: false;
  error: string;
}

const LATEST_POINTER_URL =
  process.env.SNAPSHOT_LATEST_URL ||
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  'http://localhost:9002/gpti-snapshots/universe_v0.1_public/_public/latest.json';

const FALLBACK_POINTER_URLS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_LATEST_POINTER_FALLBACKS
);

const MINIO_INTERNAL_ROOT =
  process.env.MINIO_INTERNAL_ROOT ||
  'http://localhost:9002/gpti-snapshots/';

const normalizePointerUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  const root = MINIO_INTERNAL_ROOT.replace(/\/+$/, '');
  const path = url.startsWith('/snapshots/')
    ? url.replace(/^\/snapshots\//, '')
    : url.replace(/^\/+/, '');
  return `${root}/${path}`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LatestPointer | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  if (!rateLimit(req, res, { windowMs: 60_000, max: 240, keyPrefix: 'latest-pointer' })) {
    return;
  }

  try {
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=120');
    const urls = [LATEST_POINTER_URL, ...FALLBACK_POINTER_URLS].map(normalizePointerUrl);
    const { data: latest, url } = await fetchJsonWithFallback<any>(urls, { cache: 'no-store' });
    logEvent('info', 'latest-pointer.remote', { source: 'remote', url });
    res.status(200).json({
      object: latest.object,
      sha256: latest.sha256,
      created_at: latest.created_at || latest.timestamp,
      count: latest.count || latest.total_records,
      source: 'remote',
    });
  } catch (error) {
    logEvent('error', 'latest-pointer.error', { message: (error as Error)?.message });
    console.error('Latest pointer API error:', error);
    
    // Send Slack alert on MinIO failure
    try {
      await alertMinIOFailure('gpti-snapshots', (error as Error)?.message || 'Unknown error');
    } catch (alertError) {
      // Ignore alerting errors
    }
    
    res.status(500).json({ success: false, error: 'Unknown error' });
  }
}
