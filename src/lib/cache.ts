/**
 * In-memory + Redis cache for API responses.
 * Re-exports redis cache with a simple get/set API for trends and other modules.
 */
import { cacheGet, cacheGetStale, cacheSet, CACHE_TTL_SEC } from "@/lib/redis";

const memory = new Map<string, { value: string; expiresAt: number }>();
const DEFAULT_TTL_SEC = 900; // 15 minutes

export async function cacheRead<T>(key: string): Promise<T | null> {
  const raw = (await cacheGet(key)) ?? readMemory(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheReadStale<T>(key: string): Promise<T | null> {
  const raw = (await cacheGetStale(key)) ?? readMemory(`${key}:stale`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheWrite(key: string, value: unknown, ttlSec = DEFAULT_TTL_SEC): Promise<void> {
  const serialized = JSON.stringify(value);
  await cacheSet(key, serialized, ttlSec);
  const expiresAt = Date.now() + ttlSec * 1000;
  memory.set(key, { value: serialized, expiresAt });
  memory.set(`${key}:stale`, { value: serialized, expiresAt: Date.now() + 86400_000 });
}

function readMemory(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

export { CACHE_TTL_SEC, DEFAULT_TTL_SEC };
