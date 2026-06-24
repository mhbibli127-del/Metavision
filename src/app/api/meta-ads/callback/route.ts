import { NextResponse } from "next/server";
import { parseOAuthState } from "@/lib/meta-ads/oauth";
import { connectFromOAuthCode, syncMetaInsights } from "@/lib/db/meta-ads";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error_description") ?? searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${base}/dashboard/meta-ads?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${base}/dashboard/meta-ads?error=missing_code`);
  }

  try {
    const payload = await parseOAuthState(state);
    if (!payload) {
      return NextResponse.redirect(`${base}/dashboard/meta-ads?error=invalid_state`);
    }

    await connectFromOAuthCode(code, payload.restaurantId);
    await syncMetaInsights(payload.restaurantId, "30d").catch(() => {});
    return NextResponse.redirect(`${base}/dashboard/meta-ads?connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(`${base}/dashboard/meta-ads?error=${encodeURIComponent(message)}`);
  }
}
