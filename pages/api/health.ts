import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  services: {
    frontend: {
      status: 'ok' | 'error';
      uptime: number;
    };
    minio: {
      status: 'ok' | 'error';
      endpoint: string;
    };
    database: {
      status: 'ok' | 'error';
      endpoint: string;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const getBaseUrl = (request: NextApiRequest): string => {
    const protoHeader = (request.headers['x-forwarded-proto'] || '').toString();
    const protocol = protoHeader ? protoHeader.split(',')[0] : 'http';
    const host = request.headers.host || 'localhost:3000';
    return `${protocol}://${host}`;
  };

  const LATEST_POINTER_URL =
    process.env.SNAPSHOT_LATEST_URL ||
    process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
    'http://localhost:9002/gpti-snapshots/universe_v0.1_public/_public/latest.json';

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

  const normalizedPointerUrl = normalizePointerUrl(LATEST_POINTER_URL);

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Check MinIO connectivity
    let minioStatus: 'ok' | 'error' = 'error';
    try {
      const minioResponse = await fetch(normalizedPointerUrl, { method: 'HEAD' });
      minioStatus = minioResponse.ok ? 'ok' : 'error';
    } catch (e) {
      minioStatus = 'error';
    }

    // Database check (via validation snapshot metrics)
    let dbStatus: 'ok' | 'error' = 'error';
    try {
      const dbResponse = await fetch(`${getBaseUrl(req)}/api/validation/snapshot-metrics`, {});
      dbStatus = dbResponse.ok ? 'ok' : 'error';
    } catch (e) {
      dbStatus = 'error';
    }

    const overallStatus = minioStatus === 'ok' && dbStatus === 'ok' ? 'ok' : 'degraded';
    const uptime = Date.now() - startTime;

    res.status(200).json({
      status: overallStatus as 'ok' | 'degraded',
      timestamp,
      version: '1.0.0',
      services: {
        frontend: {
          status: 'ok',
          uptime,
        },
        minio: {
          status: minioStatus,
          endpoint: normalizedPointerUrl,
        },
        database: {
          status: dbStatus,
          endpoint: 'postgresql://internal',
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'down',
      timestamp,
      version: '1.0.0',
      services: {
        frontend: {
          status: 'error',
          uptime: 0,
        },
        minio: {
          status: 'error',
          endpoint: normalizedPointerUrl,
        },
        database: {
          status: 'error',
          endpoint: 'postgresql://internal',
        },
      },
    });
  }
}
