import { NextResponse } from "next/server";
import { fetchMarketGaps } from "@/lib/db/delivery";

export async function GET() {
  try {
    const data = await fetchMarketGaps();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
