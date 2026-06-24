import type { RedisOptions } from 'ioredis';

/** Upstash və digər TLS Redis hostları üçün Bull + ioredis konfiqurasiyası */
export function getRedisConnection(): RedisOptions | string {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  if (!url.startsWith('rediss://')) {
    return url;
  }

  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    tls: {},
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
