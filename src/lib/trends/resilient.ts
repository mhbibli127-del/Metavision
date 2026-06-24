import type { ApiClientResponse, ApiSource } from "@/lib/apiClient";
import { cacheGet, cacheGetStale, cacheSet } from "@/lib/redis";

const DEFAULT_TTL_SEC = 900; // 15 minutes

async function readCacheArray(key: string): Promise<string[] | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readStaleCacheArray(key: string): Promise<string[] | null> {
  const raw = await cacheGetStale(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type ResilientOptions = {
  ttlSec?: number;
  minItems?: number;
  force?: boolean;
};

/**
 * Cache-first trend fetch: live → cache → fallback. Never throws.
 */
export async function resilientTrendFetch(
  apiName: string,
  cacheKey: string,
  fetchLive: () => Promise<string[]>,
  fallbackData: string[],
  options?: ResilientOptions,
): Promise<ApiClientResponse<string[]>> {
  const ttl = options?.ttlSec ?? DEFAULT_TTL_SEC;
  const min = options?.minItems ?? 2;
  const force = options?.force ?? false;

  if (!force) {
    const cached = await readCacheArray(cacheKey);
    if (cached && cached.length >= min) {
      console.log(`[${apiName}] cache hit (${cached.length} items)`);
      return { success: true, data: cached, error: null, source: "cache" };
    }
  }

  try {
    const live = await fetchLive();
    if (live.length >= min) {
      await cacheSet(cacheKey, JSON.stringify(live), ttl);
      console.log(`[${apiName}] live success (${live.length} items)`);
      return { success: true, data: live, error: null, source: "live" };
    }
    throw new Error(`insufficient data (${live.length} items)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    console.log(`[${apiName}] live failed:`, msg);

    const stale = await readStaleCacheArray(cacheKey);
    if (stale && stale.length >= min) {
      console.log(`[${apiName}] stale cache (${stale.length} items)`);
      return { success: true, data: stale, error: msg, source: "cache" };
    }

    console.log(`[${apiName}] fallback (${fallbackData.length} items)`);
    return { success: false, data: fallbackData, error: msg, source: "fallback" };
  }
}

export function toTrendPayload(
  source: string,
  res: ApiClientResponse<string[]>,
): {
  source: string;
  trends: string[];
  updatedAt: string;
  dataSource: ApiSource;
  success: boolean;
  stale?: boolean;
  meta?: Record<string, unknown>;
} {
  return {
    source,
    trends: res.data,
    updatedAt: new Date().toISOString(),
    dataSource: res.source,
    success: res.success || res.source !== "fallback",
    stale: res.source === "cache" && Boolean(res.error),
    meta: {
      itemCount: res.data.length,
      ...(res.error ? { note: res.error } : {}),
      ...(res.source === "fallback" && /token|401|403|expired/i.test(res.error ?? "")
        ? { authHint: "X_BEARER_TOKEN developer.x.com-da yeniləyin və ya OAuth2 App permissions yoxlayın" }
        : {}),
    },
  };
}
