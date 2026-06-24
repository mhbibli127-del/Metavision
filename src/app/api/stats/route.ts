import { NextResponse } from "next/server";
import { fetchOrderStats } from "@/lib/db/dashboard";
import type { Currency } from "@/lib/prisma-types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") as Currency | null;
    const stats = await fetchOrderStats(currency ?? undefined);
    return NextResponse.json({ stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
