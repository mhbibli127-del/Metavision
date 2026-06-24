import { NextResponse } from "next/server";
import {
  disconnectMetaAds,
  getMetaAdsDashboard,
  syncMetaInsights,
} from "@/lib/db/meta-ads";
import { requireRestaurant } from "@/lib/db/session";
import type { MetaAdsRange } from "@/lib/meta-ads/types";
import { getUnifiedTrends } from "@/services/trends/trendsService";

async function withTrendContext<T extends Record<string, unknown>>(payload: T) {
  try {
    const trends = await getUnifiedTrends();
    return {
      ...payload,
      trendContext: {
        hashtags: trends.hashtags,
        headlines: trends.headlines,
        updatedAt: trends.updatedAt,
      },
    };
  } catch {
    return payload;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") ?? "30d") as MetaAdsRange;
    const sync = searchParams.get("sync") === "true";
    const data = await getMetaAdsDashboard(range, sync);
    return NextResponse.json(await withTrendContext(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" || message === "Restaurant not found" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  try {
    const restaurant = await requireRestaurant();
    await disconnectMetaAds(restaurant.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const restaurant = await requireRestaurant();
    const body = (await request.json().catch(() => ({}))) as { range?: MetaAdsRange };
    const range = body.range ?? "30d";
    const result = await syncMetaInsights(restaurant.id, range);
    const data = await getMetaAdsDashboard(range, false);
    return NextResponse.json(await withTrendContext({ ...data, sync: result }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
