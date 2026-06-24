import type { Currency } from "@/lib/prisma-types";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";

const STATS_TTL = 30;

export async function getCachedOrderStats(
  userId: string,
  currency: Currency,
  loader: () => Promise<{
    total: number;
    completed: number;
    pending: number;
    revenue: number;
    todayDelta: number;
    currency: Currency;
  }>,
) {
  const key = `stats:${userId}:${currency}`;
  const cached = await cacheGet(key);
  if (cached) {
    try {
      return JSON.parse(cached) as Awaited<ReturnType<typeof loader>>;
    } catch {
      /* refresh */
    }
  }
  const stats = await loader();
  await cacheSet(key, JSON.stringify(stats), STATS_TTL);
  return stats;
}

export async function invalidateOrderStatsCache(userId: string) {
  for (const c of ["AZN", "USD", "EUR"] as Currency[]) {
    await cacheDel(`stats:${userId}:${c}`);
  }
}
