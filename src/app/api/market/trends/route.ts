import { NextResponse } from "next/server";
import { fetchMarketTrends } from "@/lib/db/market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Baku";
  const trends = await fetchMarketTrends(city).catch(() => []);
  return NextResponse.json({ trends, city });
}
