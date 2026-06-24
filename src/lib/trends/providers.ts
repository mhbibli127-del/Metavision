import { apiFetch } from "@/lib/apiClient";
import {
  GOOGLE_FALLBACK,
  NEWS_FALLBACK,
  TIKTOK_FALLBACK,
  X_FALLBACK,
} from "@/lib/trends/fallbacks";
import { getTrendsEnv } from "@/lib/trends/env";
import { resilientTrendFetch, toTrendPayload } from "@/lib/trends/resilient";
import { getXBearerCandidates, buildOAuth1AuthorizationHeader } from "@/services/trends/xAuth";
import type { TrendPayload, UnifiedTrendsResponse } from "@/services/trends/types";

export const TIKTOK_CACHE_KEY = "tiktok:trends";
export const GOOGLE_CACHE_KEY = "google:trends";
export const NEWS_CACHE_KEY = "news:trends";
export const X_CACHE_KEY = "x:trends";

function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const tag = t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`;
    const key = tag.toLowerCase();
    if (!seen.has(key) && tag.length > 2) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, 25);
}

async function rapidGetJson(host: string, path: string, key: string): Promise<unknown> {
  const url = `https://${host}${path}`;
  const res = await apiFetch({
    apiName: `RapidAPI/${host}`,
    url,
    init: {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": host,
        Accept: "application/json",
      },
    },
  });
  if (!res.success || res.data == null) {
    throw new Error(res.error ?? "RapidAPI request failed");
  }
  return res.data;
}

function walkStrings(obj: unknown, out: string[], depth = 0, max = 30): void {
  if (depth > 6 || out.length >= max) return;
  if (typeof obj === "string") {
    if (obj.startsWith("#") || obj.length > 3) out.push(obj);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((x) => walkStrings(x, out, depth + 1, max));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (/trend|hashtag|name|text|title|headline/i.test(k) && typeof v === "string") {
        out.push(v);
      }
      walkStrings(v, out, depth + 1, max);
    }
  }
}

// ─── TikTok ───────────────────────────────────────────────────────────────

async function fetchTikTokLive(): Promise<string[]> {
  const { tiktokKey } = getTrendsEnv();
  if (!tiktokKey) throw new Error("TIKTOK_API_KEY not configured");

  const host = process.env.RAPIDAPI_TIKTOK_HOST ?? "tiktok-scraper7.p.rapidapi.com";
  const path = process.env.RAPIDAPI_TIKTOK_PATH ?? "/trending/hashtag";
  const data = await rapidGetJson(host, path, tiktokKey);
  const tags: string[] = [];
  walkStrings(data, tags);
  const normalized = normalizeTags(tags);
  if (normalized.length >= 2) return normalized;

  // No official API — safe mock when RapidAPI returns empty
  return TIKTOK_FALLBACK;
}

// ─── Google Trends ──────────────────────────────────────────────────────────

async function fetchGoogleLive(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(
      "https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=0&geo=AZ&ns=15",
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );
    clearTimeout(timer);
    console.log("[GoogleTrends] status:", res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const json = JSON.parse(text.replace(/^\)\]\}'[,]?\s*/, "")) as {
      default?: { trendingSearchesDays?: Array<{ trendingSearches?: Array<{ title?: { query?: string } }> }> };
    };
    const queries = (json.default?.trendingSearchesDays ?? [])
      .flatMap((d) => d.trendingSearches ?? [])
      .map((t) => t.title?.query?.trim())
      .filter((q): q is string => Boolean(q));
    if (queries.length >= 2) return queries.slice(0, 20);
  } catch (err) {
    console.log("[GoogleTrends] error:", err instanceof Error ? err.message : err);
  }
  return GOOGLE_FALLBACK;
}

// ─── X / Twitter (api.twitter.com only — no x.ai) ─────────────────────────

async function fetchXTrendsV11OAuth1(): Promise<string[]> {
  const woeid = process.env.X_TRENDS_WOEID ?? "23424775";
  const url = `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`;
  const auth = buildOAuth1AuthorizationHeader("GET", url);
  if (!auth) throw new Error("X_ACCESS_TOKEN not configured");

  const res = await apiFetch<Array<{ trends?: Array<{ name?: string }> }>>({
    apiName: "X-Twitter-OAuth1",
    url,
    init: {
      headers: {
        Authorization: auth,
        "User-Agent": "MetavisionTrends/1.0",
      },
    },
  });

  if (res.success && Array.isArray(res.data)) {
    const trends = res.data[0]?.trends ?? [];
    const tags = normalizeTags(trends.map((t) => t.name ?? ""));
    if (tags.length >= 2) return tags;
  }

  throw new Error(res.error ?? "Twitter OAuth1 trends empty");
}

async function fetchXTrendsV11(bearer: string): Promise<string[]> {
  const woeid = process.env.X_TRENDS_WOEID ?? "23424775";
  const res = await apiFetch<Array<{ trends?: Array<{ name?: string }> }>>({
    apiName: "X-Twitter-v1.1",
    url: `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`,
    init: {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "User-Agent": "MetavisionTrends/1.0",
      },
    },
  });

  if (res.success && Array.isArray(res.data)) {
    const trends = res.data[0]?.trends ?? [];
    const tags = normalizeTags(trends.map((t) => t.name ?? ""));
    if (tags.length >= 2) return tags;
  }

  if (res.error?.includes("401") || res.error?.includes("403")) {
    throw new Error("X token invalid or expired — developer.x.com-da yeniləyin");
  }

  throw new Error(res.error ?? "Twitter v1.1 trends empty");
}

async function fetchXRecentSearch(bearer: string): Promise<string[]> {
  const query =
    process.env.X_SEARCH_QUERY ?? "baku restaurant OR azerbaijan food OR #bakufood";
  const res = await apiFetch<{ data?: Array<{ text?: string }> }>({
    apiName: "X-Twitter-v2",
    url: `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=25&tweet.fields=public_metrics`,
    init: {
      headers: { Authorization: `Bearer ${bearer}` },
    },
  });

  if (res.success && res.data?.data?.length) {
    const hashtags: string[] = [];
    for (const tweet of res.data.data) {
      const matches = tweet.text?.match(/#[\w\u0400-\u04FF]+/g) ?? [];
      hashtags.push(...matches);
    }
    const normalized = normalizeTags(
      hashtags.length ? hashtags : res.data.data.map((t) => t.text?.slice(0, 60) ?? "").filter(Boolean),
    );
    if (normalized.length >= 2) return normalized;
  }

  throw new Error(res.error ?? "Twitter v2 search empty");
}

async function fetchXTwitterLive(): Promise<string[]> {
  const errors: string[] = [];
  const bearers = await getXBearerCandidates();

  // Primary: v2 recent search (required endpoint)
  for (const bearer of bearers) {
    try {
      return await fetchXRecentSearch(bearer);
    } catch (e) {
      errors.push(`v2: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  try {
    return await fetchXTrendsV11OAuth1();
  } catch (e) {
    errors.push(`oauth1: ${e instanceof Error ? e.message : "failed"}`);
  }

  for (const bearer of bearers) {
    try {
      return await fetchXTrendsV11(bearer);
    } catch (e) {
      errors.push(`v1.1: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  throw new Error(errors.join("; ") || "Twitter API failed");
}

async function fetchXRapidLive(): Promise<string[]> {
  const { rapidApiKey } = getTrendsEnv();
  if (!rapidApiKey) throw new Error("RAPIDAPI_KEY not configured");

  const host = process.env.RAPIDAPI_TWITTER_HOST ?? "twitter154.p.rapidapi.com";
  const path = process.env.RAPIDAPI_TWITTER_PATH ?? "/trends/";
  const data = await rapidGetJson(host, path, rapidApiKey);
  const tags: string[] = [];
  walkStrings(data, tags);
  const normalized = normalizeTags(tags);
  if (normalized.length >= 2) return normalized;
  throw new Error("RapidAPI X returned insufficient data");
}

async function fetchXLive(): Promise<string[]> {
  const errors: string[] = [];

  try {
    return await fetchXTwitterLive();
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "twitter failed");
  }

  try {
    return await fetchXRapidLive();
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "rapidapi failed");
  }

  throw new Error(errors.join("; ") || "X fetch failed");
}

// ─── News ───────────────────────────────────────────────────────────────────

async function fetchNewsLive(): Promise<string[]> {
  const { newsKey, rapidApiKey } = getTrendsEnv();
  const country = process.env.NEWS_API_COUNTRY ?? "az";

  if (newsKey) {
    const res = await apiFetch<{ articles?: Array<{ title?: string }> }>({
      apiName: "NewsAPI",
      url: `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=20&apiKey=${encodeURIComponent(newsKey)}`,
    });

    if (res.success) {
      const titles = (res.data?.articles ?? [])
        .map((a) => a.title?.trim())
        .filter((t): t is string => Boolean(t));
      if (titles.length >= 2) return titles.slice(0, 15);
    }

    if (res.error?.includes("429")) {
      console.log("[NewsAPI] quota exceeded (429) — trying RapidAPI");
    } else if (!res.success) {
      console.log("[NewsAPI] failed:", res.error);
    }
  }

  if (rapidApiKey) {
    const host = process.env.RAPIDAPI_NEWS_HOST ?? "real-time-news-data.p.rapidapi.com";
    const path = process.env.RAPIDAPI_NEWS_PATH ?? `/top-headlines?country=${country}&lang=az`;
    const data = await rapidGetJson(host, path, rapidApiKey);
    const headlines: string[] = [];
    walkStrings(data, headlines);
    const unique = [...new Set(headlines)].filter((h) => h.length > 15 && h.length < 200).slice(0, 15);
    if (unique.length >= 2) return unique;
  }

  return NEWS_FALLBACK;
}

// ─── Public API ─────────────────────────────────────────────────────────────

type Source = "tiktok" | "google" | "news" | "x";

const LIVE_FETCHERS: Record<Source, () => Promise<string[]>> = {
  tiktok: fetchTikTokLive,
  google: fetchGoogleLive,
  news: fetchNewsLive,
  x: fetchXLive,
};

const FALLBACKS: Record<Source, string[]> = {
  tiktok: TIKTOK_FALLBACK,
  google: GOOGLE_FALLBACK,
  news: NEWS_FALLBACK,
  x: X_FALLBACK,
};

const CACHE_KEYS: Record<Source, string> = {
  tiktok: TIKTOK_CACHE_KEY,
  google: GOOGLE_CACHE_KEY,
  news: NEWS_CACHE_KEY,
  x: X_CACHE_KEY,
};

export async function getTrendSource(
  source: Source,
  options?: { force?: boolean },
): Promise<TrendPayload & { success: boolean; dataSource: "live" | "cache" | "fallback" }> {
  const res = await resilientTrendFetch(
    source.toUpperCase(),
    CACHE_KEYS[source],
    LIVE_FETCHERS[source],
    FALLBACKS[source],
    { force: options?.force },
  );
  return toTrendPayload(source, res) as TrendPayload & {
    success: boolean;
    dataSource: "live" | "cache" | "fallback";
  };
}

export async function getXTrendsResponse(options?: { force?: boolean }) {
  return getTrendSource("x", options);
}

export async function getUnifiedTrendsResponse(options?: { force?: boolean }): Promise<
  UnifiedTrendsResponse & {
    success: boolean;
    sourcesMeta: Record<Source, { dataSource: string; success: boolean }>;
  }
> {
  const sources: UnifiedTrendsResponse["sources"] = {};
  const sourcesMeta: Record<Source, { dataSource: string; success: boolean }> = {
    tiktok: { dataSource: "fallback", success: false },
    google: { dataSource: "fallback", success: false },
    news: { dataSource: "fallback", success: false },
    x: { dataSource: "fallback", success: false },
  };

  await Promise.all(
    (Object.keys(LIVE_FETCHERS) as Source[]).map(async (source) => {
      const block = await getTrendSource(source, options);
      sources[source] = block;
      sourcesMeta[source] = { dataSource: block.dataSource, success: block.success };
    }),
  );

  const hashtags = [
    ...new Set(
      [sources.tiktok, sources.google, sources.x]
        .flatMap((s) => s?.trends ?? [])
        .filter((t) => t.startsWith("#")),
    ),
  ].slice(0, 30);

  const headlines = (sources.news?.trends ?? []).slice(0, 15);
  const allLive = Object.values(sourcesMeta).every((m) => m.dataSource === "live");

  return {
    updatedAt: new Date().toISOString(),
    sources,
    hashtags,
    headlines,
    success: allLive,
    sourcesMeta,
  };
}
