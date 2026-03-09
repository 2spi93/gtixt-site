// 🚀 GTIXT Redis Cache Client (Next.js App Router)
// Permet de cacher les données snapshot avec TTL 5min

import { Redis } from 'ioredis';

/**
 * Redis client singleton
 */
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Timeout après 5s
      connectTimeout: 5000,
      commandTimeout: 5000,
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }

  return redisClient;
}

/**
 * Stats du cache (hit rate, memory usage)
 */
export interface CacheStats {
  hitRate: number;
  missRate: number;
  memoryUsedMB: number;
  keys: number;
  uptime: number;
}

export async function getCacheStats(): Promise<CacheStats | null> {
  try {
    const redis = getRedisClient();
    const info = await redis.info('stats');
    const memory = await redis.info('memory');
    
    // Parse Redis INFO output
    const hitRate = parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
    const missRate = parseFloat(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
    const total = hitRate + missRate;
    
    const memoryUsed = parseFloat(memory.match(/used_memory:(\d+)/)?.[1] || '0');
    const uptime = parseFloat(info.match(/uptime_in_seconds:(\d+)/)?.[1] || '0');
    
    const dbKeys = await redis.dbsize();
    
    return {
      hitRate: total > 0 ? (hitRate / total) * 100 : 0,
      missRate: total > 0 ? (missRate / total) * 100 : 0,
      memoryUsedMB: memoryUsed / 1024 / 1024,
      keys: dbKeys,
      uptime,
    };
  } catch (err) {
    console.error('[Redis] Failed to get stats:', err);
    return null;
  }
}

/**
 * Récupère une valeur depuis Redis cache
 * 
 * @param key Clé du cache
 * @returns Valeur parsée (JSON) ou null
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const value = await redis.get(key);
    
    if (!value) {
      return null;
    }
    
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('[Redis] Failed to get cached value:', key, err);
    return null;
  }
}

/**
 * Met en cache une valeur avec TTL
 * 
 * @param key Clé du cache
 * @param value Valeur à cacher (sera JSON.stringify)
 * @param ttlSeconds TTL en secondes (défaut: 5min = 300s)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const serialized = JSON.stringify(value);
    
    await redis.setex(key, ttlSeconds, serialized);
    return true;
  } catch (err) {
    console.error('[Redis] Failed to set cached value:', key, err);
    return false;
  }
}

/**
 * Invalide le cache pour une clé ou pattern
 * 
 * @param pattern Pattern Redis (ex: "firms:*")
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient();
    
    // Si pattern simple, delete direct
    if (!pattern.includes('*') && !pattern.includes('?')) {
      await redis.del(pattern);
      return 1;
    }
    
    // Si pattern avec wildcard, scan + delete
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const [nextCursor, matchedKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    console.log(`[Redis] Invalidated ${keys.length} keys matching "${pattern}"`);
    return keys.length;
  } catch (err) {
    console.error('[Redis] Failed to invalidate cache:', pattern, err);
    return 0;
  }
}

/**
 * Helper: Cache-aside pattern pour snapshot
 * 
 * Usage:
 *   const snapshot = await cacheSnapshot('latest', async () => {
 *     return await fetchFromMinIO();
 *   });
 */
export async function cacheSnapshot<T>(
  snapshotId: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cacheKey = `snapshot:${snapshotId}`;
  
  // Try cache first
  const cached = await getCached<T>(cacheKey);
  if (cached) {
    console.log(`[Redis] Cache HIT: ${cacheKey}`);
    return cached;
  }
  
  console.log(`[Redis] Cache MISS: ${cacheKey}`);
  
  // Fetch from source
  const data = await fetcher();
  
  // Store in cache (fire-and-forget)
  setCached(cacheKey, data, ttlSeconds).catch(err => {
    console.error('[Redis] Failed to cache snapshot:', err);
  });
  
  return data;
}

/**
 * Ferme la connexion Redis (cleanup)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
