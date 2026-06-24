import { NextResponse } from "next/server";
import { collectDashboardData } from "@/features/hyperdimension/data-collector";
import { runExecutiveBrain } from "@/engines/hyperdimension/brain/executive-brain";
import { answerScenarioQuestion } from "@/engines/hyperdimension/brain/scenario-chat";
import { getUserRestaurant } from "@/lib/db/session";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: string };
    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "message tələb olunur" }, { status: 400 });
    }

    const [data, restaurant] = await Promise.all([
      collectDashboardData(),
      getUserRestaurant().catch(() => null),
    ]);
    const hasRestaurant = Boolean(restaurant);
    const city = restaurant?.city ?? "Bakı";
    const brain = runExecutiveBrain(data, city, hasRestaurant);
    const reply = answerScenarioQuestion(message, brain.scenarios, { city, hasRestaurant });

    return NextResponse.json({
      ...reply,
      analyzedAt: brain.analyzedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
