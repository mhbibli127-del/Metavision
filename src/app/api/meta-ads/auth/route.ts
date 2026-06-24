import { NextResponse } from "next/server";
import { requireRestaurant } from "@/lib/db/session";
import { createOAuthState, buildOAuthUrl } from "@/lib/meta-ads/oauth";
import { getMetaConfig } from "@/lib/meta-ads/config";

export async function GET() {
  try {
    const { isConfigured } = getMetaConfig();
    if (!isConfigured) {
      return NextResponse.json(
        { error: "META_APP_ID və META_APP_SECRET konfiqurasiya edilməyib." },
        { status: 503 },
      );
    }

    const restaurant = await requireRestaurant();
    const state = await createOAuthState(restaurant.id);
    const url = buildOAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth failed";
    const status = message === "Unauthorized" || message === "Restaurant not found" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
