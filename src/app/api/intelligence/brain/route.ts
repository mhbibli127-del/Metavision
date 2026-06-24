import { NextResponse } from "next/server";
import { collectDashboardData } from "@/features/hyperdimension/data-collector";
import { runExecutiveBrain } from "@/engines/hyperdimension/brain/executive-brain";
import { getUserRestaurant } from "@/lib/db/session";

export async function GET() {
  try {
    const [data, restaurant] = await Promise.all([
      collectDashboardData(),
      getUserRestaurant().catch(() => null),
    ]);
    const hasRestaurant = Boolean(restaurant);
    const city = restaurant?.city ?? "Bakı";
    const brain = runExecutiveBrain(data, city, hasRestaurant);

    return NextResponse.json({
      ...brain,
      city,
      restaurantName: restaurant?.name ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Brain analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
