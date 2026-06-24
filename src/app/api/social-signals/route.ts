import { NextResponse } from "next/server";
import { getSocialSignalsConfig } from "@/lib/social-signals/config";
import { fetchFallbackSocialSignals, mergeTrendPayload } from "@/lib/social-signals/fallback";
import { getUnifiedTrendsResponse } from "@/lib/trends/providers";
import { trendsRateLimit } from "@/lib/trends-rate-limit";

export async function GET(request: Request) {
  const limited = trendsRateLimit(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "true";

  try {
    const config = getSocialSignalsConfig();
    let trends = await getUnifiedTrendsResponse({ force });
    let fallbackUsed = false;

    const fb = await fetchFallbackSocialSignals();
    const needsFallback = (["x", "tiktok", "news"] as const).some((key) => {
      const block = trends.sources[key];
      return !block?.trends?.length || block.dataSource === "fallback";
    });

    if (needsFallback) {
      fallbackUsed = true;
      trends = {
        ...trends,
        sources: {
          ...trends.sources,
          x: mergeTrendPayload(trends.sources.x, fb.x),
          tiktok: mergeTrendPayload(trends.sources.tiktok, fb.tiktok),
          news: mergeTrendPayload(trends.sources.news, fb.news),
        },
        hashtags: [...new Set([...trends.hashtags, ...fb.x.trends])].slice(0, 30),
        headlines: [...new Set([...trends.headlines, ...fb.news.trends])].slice(0, 15),
      };
    }

    const foodSignals = [
      ...trends.hashtags,
      ...trends.headlines.filter((h) => /food|restaurant|dining|menu|cuisine|bakı|baku|restoran/i.test(h)),
    ].slice(0, 20);

    return NextResponse.json({
      ...trends,
      success: true,
      config,
      foodSignals,
      fallbackUsed,
      primarySource: "rapidapi_x",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Social signals failed";
    const fb = await fetchFallbackSocialSignals();
    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      sources: {
        x: { ...fb.x, dataSource: "fallback" as const },
        tiktok: { ...fb.tiktok, dataSource: "fallback" as const },
        news: { ...fb.news, dataSource: "fallback" as const },
        google: {
          source: "google",
          trends: [],
          updatedAt: new Date().toISOString(),
          dataSource: "fallback" as const,
        },
      },
      hashtags: fb.x.trends,
      headlines: fb.news.trends,
      foodSignals: fb.foodSignals,
      config: getSocialSignalsConfig(),
      fallbackUsed: true,
      meta: { note: message },
    });
  }
}
