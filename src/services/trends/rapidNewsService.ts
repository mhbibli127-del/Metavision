import { rapidGet } from "./http";
import type { TrendPayload } from "./types";

/** RapidAPI news fallback when NEWS_API_KEY is missing or rate-limited */
export async function fetchRapidNewsTrends(): Promise<TrendPayload> {
  const hosts = [
    process.env.RAPIDAPI_NEWS_HOST ?? "real-time-news-data.p.rapidapi.com",
    "google-news13.p.rapidapi.com",
    "news-api14.p.rapidapi.com",
  ];

  const country = process.env.NEWS_API_COUNTRY ?? "az";
  const paths = [
    process.env.RAPIDAPI_NEWS_PATH ?? `/top-headlines?country=${country}&lang=az`,
    `/search?query=azerbaijan+restaurant&country=${country}`,
    `/latest?country=${country}`,
  ];

  for (const host of hosts) {
    for (const path of paths) {
      try {
        const data = await rapidGet<Record<string, unknown>>(host, path);
        const headlines: string[] = [];

        const walk = (obj: unknown, depth = 0): void => {
          if (depth > 6 || headlines.length > 20) return;
          if (typeof obj === "string" && obj.length > 20 && obj.length < 200) {
            if (/restaurant|food|dining|bakı|baku|azərbaycan|cuisine|menu/i.test(obj)) {
              headlines.push(obj.trim());
            }
            return;
          }
          if (Array.isArray(obj)) {
            obj.forEach((x) => walk(x, depth + 1));
            return;
          }
          if (obj && typeof obj === "object") {
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
              if (/title|headline|description|name/i.test(k) && typeof v === "string") {
                headlines.push(v.trim());
              }
              walk(v, depth + 1);
            }
          }
        };

        walk(data);
        const unique = [...new Set(headlines)].slice(0, 15);
        if (unique.length >= 2) {
          return {
            source: "news",
            trends: unique,
            updatedAt: new Date().toISOString(),
            meta: { provider: "rapidapi", host, count: unique.length },
          };
        }
      } catch {
        /* try next */
      }
    }
  }

  throw new Error("RapidAPI news endpoints unavailable");
}
