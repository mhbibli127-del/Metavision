import { NextResponse } from "next/server";
import { getAllRates } from "@/lib/currency";
import type { Currency } from "@/lib/prisma-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get("base") ?? "AZN") as Currency;

  try {
    const data = await getAllRates(base);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rates unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
