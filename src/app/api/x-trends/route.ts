import { NextResponse } from "next/server";
import { getXTrendsResponse } from "@/lib/trends/providers";
import { X_FALLBACK } from "@/lib/trends/fallbacks";
import { trendsRateLimit } from "@/lib/trends-rate-limit";

export async function GET(request: Request) {
  const limited = trendsRateLimit(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "true";

  const block = await getXTrendsResponse({ force });

  return NextResponse.json({
    success: block.dataSource !== "fallback",
    data: block.trends,
    error: block.meta?.note ?? null,
    source: block.dataSource,
    trends: block.trends,
    updatedAt: block.updatedAt,
    meta: block.meta,
    // Explicit fallback shape when all providers fail
    ...(block.dataSource === "fallback" && block.trends.length === 0
      ? { data: X_FALLBACK, trends: X_FALLBACK, source: "fallback" as const }
      : {}),
  });
}
