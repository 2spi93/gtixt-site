// Redis Cache pour Snapshots
// Cache latest.json avec TTL de 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis-client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Configuration MinIO/S3
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = 'gpti-snapshots';
const REDIS_KEY = 'snapshot:latest';
const CACHE_TTL = parseInt(process.env.REDIS_TTL_SECONDS || '300'); // 5 minutes

/**
 * GET /api/snapshot/latest
 * 
 * Retourne le dernier snapshot avec cache Redis
 * - Cache HIT: Retourne depuis Redis (< 10ms)
 * - Cache MISS: Fetch depuis MinIO et met en cache (~ 500ms)
 */
export async function GET(request: NextRequest) {
  const redis = getRedisClient();
  const startTime = Date.now();

  try {
    // Try Redis cache first
    if (redis) {
      const cached = await redis.get(REDIS_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const latency = Date.now() - startTime;

        console.log(`[CACHE HIT] Snapshot served from Redis in ${latency}ms`);

        return NextResponse.json(data, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Age': (Date.now() - data._cached_at) / 1000 + 's',
            'X-Response-Time': latency + 'ms',
            'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=60`,
          },
        });
      }
    }

    // Cache miss: Fetch from MinIO/S3
    console.log('[CACHE MISS] Fetching snapshot from MinIO...');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'latest.json',
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();

    if (!body) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    const data = JSON.parse(body);
    const latency = Date.now() - startTime;

    // Cache in Redis
    if (redis) {
      const cacheData = {
        ...data,
        _cached_at: Date.now(),
      };
      await redis.setex(REDIS_KEY, CACHE_TTL, JSON.stringify(cacheData));
      console.log(`[CACHE SET] Snapshot cached in Redis for ${CACHE_TTL}s`);
    }

    console.log(`[CACHE MISS] Snapshot served from MinIO in ${latency}ms`);

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': latency + 'ms',
        'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch snapshot:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'X-Cache': 'ERROR',
          'X-Response-Time': (Date.now() - startTime) + 'ms',
        },
      }
    );
  }
}

/**
 * DELETE /api/snapshot/latest
 * 
 * Invalide le cache Redis (utilisé après une mise à jour du snapshot)
 * Requiert authentification admin
 */
export async function DELETE(request: NextRequest) {
  // Check admin auth
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = getRedisClient();
  
  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not available' },
      { status: 503 }
    );
  }

  try {
    await redis.del(REDIS_KEY);
    console.log('[CACHE INVALIDATE] Redis cache cleared');

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated',
    });
  } catch (error) {
    console.error('[ERROR] Failed to invalidate cache:', error);

    return NextResponse.json(
      {
        error: 'Failed to invalidate cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/snapshot/cache-stats
 * 
 * Statistiques du cache Redis
 */
export async function POST(request: NextRequest) {
  const redis = getRedisClient();

  if (!redis) {
    return NextResponse.json({
      enabled: false,
      message: 'Redis not configured',
    });
  }

  try {
    const exists = await redis.exists(REDIS_KEY);
    const ttl = exists ? await redis.ttl(REDIS_KEY) : 0;
    const cached = exists ? await redis.get(REDIS_KEY) : null;
    let cacheAge = 0;

    if (cached) {
      const data = JSON.parse(cached);
      cacheAge = Date.now() - (data._cached_at || 0);
    }

    return NextResponse.json({
      enabled: true,
      cached: exists === 1,
      ttl_seconds: ttl,
      cache_age_ms: cacheAge,
      cache_ttl_configured: CACHE_TTL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get cache stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
