import { createClient, type RedisClientType } from "redis";

const CACHE_TTL_SEC = 600; // 10 minutes
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;

async function getClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (client?.isOpen) return client;

  if (!connecting) {
    connecting = (async () => {
      try {
        const c = createClient({ url });
        c.on("error", () => {
          /* silent — fallback to memory */
        });
        await c.connect();
        client = c as RedisClientType;
        return client;
      } catch {
        return null;
      } finally {
        connecting = null;
      }
    })();
  }

  return connecting;
}

export async function redisPublish(channel: string, message: string): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    await redis.publish(channel, message);
  } catch {
    /* optional */
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getClient();
  if (redis) {
    try {
      return await redis.get(key);
    } catch {
      /* fall through */
    }
  }

  const mem = memoryStore.get(key);
  if (!mem) return null;
  if (Date.now() > mem.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return mem.value;
}

export async function cacheGetStale(key: string): Promise<string | null> {
  const fresh = await cacheGet(key);
  if (fresh) return fresh;

  const redis = await getClient();
  if (redis) {
    try {
      const staleKey = `${key}:stale`;
      return await redis.get(staleKey);
    } catch {
      /* fall through */
    }
  }

  const mem = memoryStore.get(`${key}:stale`);
  return mem?.value ?? null;
}

export async function cacheSet(key: string, value: string, ttlSec = CACHE_TTL_SEC): Promise<void> {
  const redis = await getClient();
  if (redis) {
    try {
      await redis.set(key, value, { EX: ttlSec });
      await redis.set(`${key}:stale`, value);
      return;
    } catch {
      /* fall through */
    }
  }

  const expiresAt = Date.now() + ttlSec * 1000;
  memoryStore.set(key, { value, expiresAt });
  memoryStore.set(`${key}:stale`, { value, expiresAt: Date.now() + 86400_000 });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getClient();
  if (redis) {
    try {
      await redis.del(key);
      await redis.del(`${key}:stale`);
    } catch {
      /* fall through */
    }
  }
  memoryStore.delete(key);
  memoryStore.delete(`${key}:stale`);
}

export { CACHE_TTL_SEC };
