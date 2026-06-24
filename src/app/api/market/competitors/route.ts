import { NextResponse } from "next/server";
import { fetchBakuCompetitors, compareWithCompetitors } from "@/lib/db/market";
import { getUserRestaurant } from "@/lib/db/session";
import type { Currency } from "@/lib/prisma-types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = (searchParams.get("currency") ?? "AZN") as Currency;
    const compare = searchParams.get("compare") === "true";

    const competitors = await fetchBakuCompetitors(currency);

    if (compare) {
      const restaurant = await getUserRestaurant();
      if (restaurant) {
        const comparison = await compareWithCompetitors(restaurant.id, currency);
        return NextResponse.json({ competitors, comparison, currency });
      }
    }

    return NextResponse.json({ competitors, currency, city: "Baku", count: competitors.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
