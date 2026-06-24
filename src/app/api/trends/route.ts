import { NextResponse } from "next/server";
import { getSocialSignalsConfig } from "@/lib/social-signals/config";
import { getUnifiedTrendsResponse } from "@/lib/trends/providers";
import { trendsRateLimit } from "@/lib/trends-rate-limit";

export async function GET(request: Request) {
  const limited = trendsRateLimit(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "true";

  const data = await getUnifiedTrendsResponse({ force });

  return NextResponse.json({
    success: data.success,
    updatedAt: data.updatedAt,
    sources: data.sources,
    hashtags: data.hashtags,
    headlines: data.headlines,
    sourcesMeta: data.sourcesMeta,
    config: getSocialSignalsConfig(),
  });
}
