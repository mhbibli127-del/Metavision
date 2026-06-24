import { NextResponse } from "next/server";
import { getUnifiedTrendsResponse } from "@/lib/trends/providers";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limited = rateLimit(`trends-refresh:${ip}`, 3, 300_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: `Too many refreshes. Wait ${limited.retryAfter}s` }, { status: 429 });
  }

  const data = await getUnifiedTrendsResponse({ force: true });
  return NextResponse.json({ ...data, ok: true });
}
