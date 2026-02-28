// /opt/gpti/gpti-site/lib/rate-limit.ts

import { getRedisClient } from './redis-client';

const inMemory = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = async (
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  const redis = getRedisClient();
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  if (!redis) {
    const entry = inMemory.get(key);
    if (!entry || entry.resetAt < now) {
      inMemory.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    inMemory.set(key, entry);
    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
  }

  const redisKey = `rate:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  const remaining = Math.max(0, maxRequests - count);
  const ttl = await redis.ttl(redisKey);
  const redisResetAt = now + Math.max(0, ttl) * 1000;

  return { allowed: count <= maxRequests, remaining, resetAt: redisResetAt };
};

export const trackTokenUsage = async (
  key: string,
  tokens: number,
  maxTokensPerDay: number
): Promise<{ allowed: boolean; remaining: number }> => {
  const redis = getRedisClient();
  const now = Date.now();
  const dayKey = `tokens:${key}:${new Date(now).toISOString().slice(0, 10)}`;

  if (!redis) {
    const entry = inMemory.get(dayKey);
    if (!entry || entry.resetAt < now) {
      inMemory.set(dayKey, { count: tokens, resetAt: now + 24 * 3600 * 1000 });
      return { allowed: tokens <= maxTokensPerDay, remaining: Math.max(0, maxTokensPerDay - tokens) };
    }

    const newCount = entry.count + tokens;
    entry.count = newCount;
    inMemory.set(dayKey, entry);
    return { allowed: newCount <= maxTokensPerDay, remaining: Math.max(0, maxTokensPerDay - newCount) };
  }

  const count = await redis.incrby(dayKey, tokens);
  if (count === tokens) {
    await redis.expire(dayKey, 24 * 3600);
  }

  return { allowed: count <= maxTokensPerDay, remaining: Math.max(0, maxTokensPerDay - count) };
};

export const getTokenUsage = async (key: string): Promise<number> => {
  const redis = getRedisClient();
  const now = Date.now();
  const dayKey = `tokens:${key}:${new Date(now).toISOString().slice(0, 10)}`;

  if (!redis) {
    const entry = inMemory.get(dayKey);
    if (!entry || entry.resetAt < now) return 0;
    return entry.count;
  }

  const value = await redis.get(dayKey);
  return value ? parseInt(value, 10) : 0;
};
