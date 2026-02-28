// /opt/gpti/gpti-site/lib/redis-client.ts

import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;

  if (!redisUrl && !host) {
    return null;
  }

  if (redisUrl) {
    redisClient = new Redis(redisUrl);
  } else {
    redisClient = new Redis({
      host: host || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    });
  }

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  return redisClient;
};
