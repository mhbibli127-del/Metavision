import axios from "axios";
import { rapidGet } from "./http";
import { getXBearerCandidates } from "./xAuth";
import type { TrendPayload } from "./types";

export const X_CACHE_KEY = "x:trends";

const RESTAURANT_QUERIES = [
  "baku restaurant",
  "azerbaijan food",
  "bakı restoran",
  "azfood",
  "dining baku",
];

function normalizeTrendTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const t = item.trim();
    if (!t) continue;
    const tag = t.startsWith("#") ? t : t.includes("#") ? t : `#${t.replace(/\s+/g, "")}`;
    const key = tag.toLowerCase();
    if (!seen.has(key) && tag.length > 2) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, 25);
}

async function fetchXTrendsV11(bearer: string): Promise<TrendPayload> {
  const woeid = process.env.X_TRENDS_WOEID ?? "23424775";

  const res = await axios.get("https://api.twitter.com/1.1/trends/place.json", {
    timeout: 12_000,
    params: { id: woeid },
    headers: {
      Authorization: `Bearer ${bearer}`,
      "User-Agent": "MetavisionTrends/1.0",
    },
  });

  const trends = (res.data?.[0]?.trends ?? []) as Array<{ name?: string; tweet_volume?: number }>;
  const tags = normalizeTrendTags(trends.map((t) => t.name ?? ""));

  return {
    source: "x",
    trends: tags,
    updatedAt: new Date().toISOString(),
    meta: { woeid, count: tags.length, provider: "twitter_v1.1" },
  };
}

async function fetchXRecentSearch(bearer: string): Promise<string[]> {
  const query = process.env.X_SEARCH_QUERY ?? RESTAURANT_QUERIES.join(" OR ");
  const res = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
    timeout: 12_000,
    params: {
      query,
      max_results: 25,
      "tweet.fields": "public_metrics,created_at",
    },
    headers: { Authorization: `Bearer ${bearer}` },
  });

  const tweets = (res.data?.data ?? []) as Array<{ text?: string }>;
  const hashtags: string[] = [];
  for (const tweet of tweets) {
    const matches = tweet.text?.match(/#[\w\u0400-\u04FF]+/g) ?? [];
    hashtags.push(...matches);
  }
  return normalizeTrendTags(hashtags.length ? hashtags : tweets.map((t) => t.text?.slice(0, 60) ?? "").filter(Boolean));
}

async function fetchXTrendsRapidApi(): Promise<TrendPayload> {
  const hosts = [
    process.env.RAPIDAPI_TWITTER_HOST ?? "twitter154.p.rapidapi.com",
    "twitter-api45.p.rapidapi.com",
    "twitter135.p.rapidapi.com",
  ];
  const paths = [
    process.env.RAPIDAPI_TWITTER_PATH ?? "/trends/",
    "/trends",
    "/search/search?query=restaurant&count=20",
  ];

  const tags: string[] = [];

  for (const host of hosts) {
    for (const path of paths) {
      try {
        const data = await rapidGet<Record<string, unknown>>(host, path);
        const walk = (obj: unknown, depth = 0): void => {
          if (depth > 5 || tags.length > 30) return;
          if (typeof obj === "string") {
            if (obj.startsWith("#") || /restaurant|food|dining|bakı|baku/i.test(obj)) {
              tags.push(obj);
            }
            return;
          }
          if (Array.isArray(obj)) {
            obj.forEach((x) => walk(x, depth + 1));
            return;
          }
          if (obj && typeof obj === "object") {
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
              if (/trend|hashtag|name|text|topic/i.test(k) && typeof v === "string") tags.push(v);
              walk(v, depth + 1);
            }
          }
        };
        walk(data);
        const normalized = normalizeTrendTags(tags);
        if (normalized.length >= 2) {
          return {
            source: "x",
            trends: normalized,
            updatedAt: new Date().toISOString(),
            meta: { provider: "rapidapi", host, path, count: normalized.length },
          };
        }
      } catch {
        /* next endpoint */
      }
    }
  }

  throw new Error("RapidAPI X/Twitter endpoints unavailable");
}

export async function fetchXTrends(): Promise<TrendPayload> {
  const errors: string[] = [];

  try {
    const bearers = await getXBearerCandidates();
    for (const bearer of bearers) {
      try {
        const v11 = await fetchXTrendsV11(bearer);
        if (v11.trends.length >= 2) return v11;
      } catch (e) {
        errors.push(`v1.1: ${e instanceof Error ? e.message : "failed"}`);
      }

      try {
        const searchTags = await fetchXRecentSearch(bearer);
        if (searchTags.length >= 2) {
          return {
            source: "x",
            trends: searchTags,
            updatedAt: new Date().toISOString(),
            meta: { provider: "twitter_v2_search", count: searchTags.length },
          };
        }
      } catch (e) {
        errors.push(`v2: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
  } catch (e) {
    errors.push(`auth: ${e instanceof Error ? e.message : "failed"}`);
  }

  if (process.env.RAPIDAPI_KEY) {
    try {
      return await fetchXTrendsRapidApi();
    } catch (e) {
      errors.push(`rapidapi: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  throw new Error(errors.join("; ") || "X trends unavailable");
}
