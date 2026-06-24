import { NextResponse } from "next/server";
import { getTrendSource } from "@/lib/trends/providers";
import { trendsRateLimit } from "@/lib/trends-rate-limit";

export async function GET(request: Request) {
  const limited = trendsRateLimit(request);
  if (limited) return limited;
  const block = await getTrendSource("google");
  return NextResponse.json({
    success: block.dataSource !== "fallback",
    data: block.trends,
    error: block.meta?.note ?? null,
    source: block.dataSource,
    trends: block.trends,
    updatedAt: block.updatedAt,
    meta: block.meta,
  });
}
