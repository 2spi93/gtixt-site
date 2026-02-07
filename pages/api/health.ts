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
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Check MinIO connectivity
    let minioStatus: 'ok' | 'error' = 'error';
    try {
      const minioResponse = await fetch(
        'http://51.210.246.61:9000/gpti-snapshots/_public/latest.json',
         { method: 'HEAD' }
      );
      minioStatus = minioResponse.ok ? 'ok' : 'error';
    } catch (e) {
      minioStatus = 'error';
    }

    // Database check (via validation endpoint)
    let dbStatus: 'ok' | 'error' = 'error';
    try {
      const dbResponse = await fetch(
        'http://localhost:3000/api/validation/metrics',
         {}
      );
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
          endpoint: 'http://51.210.246.61:9000',
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
          endpoint: 'http://51.210.246.61:9000',
        },
        database: {
          status: 'error',
          endpoint: 'postgresql://internal',
        },
      },
    });
  }
}
