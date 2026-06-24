import type { TrendPayload, UnifiedTrendsResponse } from "./types";
import {
  getTrendSource,
  getUnifiedTrendsResponse,
  GOOGLE_CACHE_KEY,
  NEWS_CACHE_KEY,
  TIKTOK_CACHE_KEY,
  X_CACHE_KEY,
} from "@/lib/trends/providers";

type Source = "tiktok" | "google" | "news" | "x";

const CACHE_KEYS: Record<Source, string> = {
  tiktok: TIKTOK_CACHE_KEY,
  google: GOOGLE_CACHE_KEY,
  news: NEWS_CACHE_KEY,
  x: X_CACHE_KEY,
};

/** @deprecated Use getTrendSource from @/lib/trends/providers */
export async function getTrends(
  source: Source,
  options?: { force?: boolean },
): Promise<TrendPayload> {
  return getTrendSource(source, options);
}

export async function refreshAllTrends(): Promise<UnifiedTrendsResponse> {
  const data = await getUnifiedTrendsResponse({ force: true });
  const { success: _s, sourcesMeta: _m, ...rest } = data;
  return rest;
}

export async function getUnifiedTrends(): Promise<UnifiedTrendsResponse> {
  const data = await getUnifiedTrendsResponse();
  const { success: _s, sourcesMeta: _m, ...rest } = data;
  return rest;
}

export { CACHE_KEYS, GOOGLE_CACHE_KEY, NEWS_CACHE_KEY, TIKTOK_CACHE_KEY, X_CACHE_KEY };
