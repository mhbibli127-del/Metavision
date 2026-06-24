import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export function trendsRateLimit(request: Request): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limited = rateLimit(`trends:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry in ${limited.retryAfter}s`, trends: [] },
      { status: 429 },
    );
  }
  return null;
}
