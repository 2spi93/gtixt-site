// Redis Cache pour Snapshots
// Cache latest.json avec TTL de 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis-client';

// Use internal snapshot URL or fallback
const SNAPSHOT_URL = process.env.SNAPSHOT_LATEST_URL || 'http://localhost:3000/snapshots/universe_v0.1_public/_public/latest.json';
const REDIS_KEY = 'snapshot:latest';
const CACHE_TTL = parseInt(process.env.REDIS_TTL_SECONDS || '300'); // 5 minutes

/**
 * GET /api/snapshot/latest
 * 
 * Retourne le dernier snapshot avec cache Redis
 * - Cache HIT: Retourne depuis Redis (< 10ms)
 * - Cache MISS: Fetch depuis l'endpoint interne et met en cache (~ 100-500ms)
 */
export async function GET(_request: NextRequest) {
  const redis = getRedisClient();
  const startTime = Date.now();

  try {
    // Try Redis cache first
    if (redis) {
      const cached = await redis.get(REDIS_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const latency = Date.now() - startTime;

        console.warn(`[CACHE HIT] Snapshot served from Redis in ${latency}ms`);

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

    // Cache miss: Fetch from internal snapshot endpoint
    console.warn('[CACHE MISS] Fetching snapshot from', SNAPSHOT_URL);

    const response = await fetch(SNAPSHOT_URL, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch snapshot: ${response.status} ${response.statusText}`);
    }

    const body = await response.text();
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
      console.warn(`[CACHE SET] Snapshot cached in Redis for ${CACHE_TTL}s`);
    }

    console.warn(`[CACHE MISS] Snapshot served from internal endpoint in ${latency}ms`);

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
    console.warn('[CACHE INVALIDATE] Redis cache cleared');

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
export async function POST(_request: NextRequest) {
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
