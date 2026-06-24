import axios from "axios";
import * as cheerio from "cheerio";
import { delay, randomUserAgent, rapidGet } from "./http";
import type { TrendPayload } from "./types";

const CACHE_KEY = "tiktok:trends";

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

/** RapidAPI TikTok — primary path (fixes 502 via correct host + fallback hosts) */
async function fetchFromRapidApi(): Promise<string[]> {
  const host =
    process.env.RAPIDAPI_TIKTOK_HOST ?? "tiktok-scraper7.p.rapidapi.com";
  const paths = [
    process.env.RAPIDAPI_TIKTOK_PATH ?? "/trending/hashtag",
    "/challenge/trending",
    "/trending",
  ];

  const hosts = [host, "tiktok-api23.p.rapidapi.com", "tiktok-trending-api.p.rapidapi.com"];

  for (const h of hosts) {
    for (const path of paths) {
      try {
        await delay(300 + Math.random() * 400);
        const data = await rapidGet<Record<string, unknown>>(h, path);
        const tags: string[] = [];

        const walk = (obj: unknown, depth = 0): void => {
          if (depth > 6 || tags.length > 30) return;
          if (typeof obj === "string" && (obj.startsWith("#") || /^[a-zA-Z0-9_]{3,}$/.test(obj))) {
            tags.push(obj.startsWith("#") ? obj : `#${obj}`);
            return;
          }
          if (Array.isArray(obj)) {
            obj.forEach((x) => walk(x, depth + 1));
            return;
          }
          if (obj && typeof obj === "object") {
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
              if (k.toLowerCase().includes("hashtag") || k.toLowerCase().includes("title") || k === "name") {
                if (typeof v === "string") tags.push(v.startsWith("#") ? v : `#${v}`);
              }
              walk(v, depth + 1);
            }
          }
        };

        walk(data);
        const normalized = normalizeTags(tags);
        if (normalized.length >= 3) return normalized;
      } catch {
        /* try next endpoint */
      }
    }
  }

  throw new Error("RapidAPI TikTok endpoints unavailable");
}

/** Cheerio scrape fallback — may be blocked; used only when RapidAPI fails */
async function fetchFromScrape(): Promise<string[]> {
  await delay(500 + Math.random() * 500);
  const res = await axios.get("https://www.tiktok.com/explore", {
    timeout: 12_000,
    headers: {
      "User-Agent": randomUserAgent(),
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,az;q=0.8",
      "Cache-Control": "no-cache",
    },
    validateStatus: (s) => s < 500,
  });

  if (res.status >= 400) throw new Error(`TikTok HTTP ${res.status}`);

  const $ = cheerio.load(res.data as string);
  const tags: string[] = [];
  $("a[href*='tag'], [data-e2e*='challenge']").each((_, el) => {
    const text = $(el).text().trim();
    if (text) tags.push(text.startsWith("#") ? text : `#${text.replace(/\s/g, "")}`);
  });

  const normalized = normalizeTags(tags);
  if (normalized.length < 2) throw new Error("Scrape returned insufficient tags");
  return normalized;
}

export async function scrapeTikTokTrends(): Promise<TrendPayload> {
  const updatedAt = new Date().toISOString();
  let trends: string[] = [];
  let error: string | undefined;

  try {
    if (process.env.RAPIDAPI_KEY) {
      trends = await fetchFromRapidApi();
    } else {
      trends = await fetchFromScrape();
    }
  } catch (e1) {
    try {
      trends = await fetchFromScrape();
    } catch (e2) {
      error = e1 instanceof Error ? e1.message : "TikTok fetch failed";
      if (e2 instanceof Error) error += `; scrape: ${e2.message}`;
      throw new Error(error);
    }
  }

  return {
    source: "tiktok",
    trends,
    updatedAt,
  };
}

export { CACHE_KEY as TIKTOK_CACHE_KEY };
