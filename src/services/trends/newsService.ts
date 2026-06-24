import axios from "axios";
import type { TrendPayload } from "./types";
import { fetchRapidNewsTrends } from "./rapidNewsService";

export const NEWS_CACHE_KEY = "news:trends";

export async function fetchNewsTrends(): Promise<TrendPayload> {
  const key = process.env.NEWS_API_KEY;

  if (key) {
    try {
      const res = await axios.get("https://newsapi.org/v2/top-headlines", {
        timeout: 12_000,
        params: {
          country: process.env.NEWS_API_COUNTRY ?? "az",
          pageSize: 20,
          apiKey: key,
        },
      });

      if (res.status === 200) {
        const articles = (res.data?.articles ?? []) as Array<{ title?: string }>;
        const trends = articles
          .map((a) => a.title?.trim())
          .filter((t): t is string => Boolean(t))
          .slice(0, 15);

        if (trends.length >= 2) {
          return {
            source: "news",
            trends,
            updatedAt: new Date().toISOString(),
            meta: { count: trends.length, provider: "newsapi" },
          };
        }
      }
    } catch {
      /* fall through to RapidAPI */
    }
  }

  if (process.env.RAPIDAPI_KEY) {
    return fetchRapidNewsTrends();
  }

  throw new Error("NEWS_API_KEY or RAPIDAPI_KEY not configured");
}
