import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeSignedPayload } from "@/lib/auth-tokens";
import { upsertIntegration, type IntegrationProvider } from "@/lib/db/integrations";

const PROVIDERS: IntegrationProvider[] = ["square", "toast"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!PROVIDERS.includes(provider as IntegrationProvider)) {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=unknown_provider`);
  }

  const { searchParams } = new URL(request.url);
  const demo = searchParams.get("demo") === "1";
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("mv_oauth_state")?.value;
  cookieStore.delete("mv_oauth_state");

  let restaurantId: string | null = null;
  if (state && savedState && state === savedState) {
    const payload = await decodeSignedPayload<{ restaurantId?: string; exp?: number }>(state);
    if (payload?.restaurantId && (payload.exp ?? 0) > Date.now()) {
      restaurantId = payload.restaurantId;
    }
  }

  if (!restaurantId) {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=invalid_state`);
  }

  try {
    if (demo || !code) {
      await upsertIntegration(restaurantId, provider as IntegrationProvider, {
        accessToken: `demo_${provider}_${Date.now()}`,
        externalAccountId: `demo-${provider}-account`,
        accountName: `${provider === "square" ? "Square" : "Toast"} Demo`,
      });
      return NextResponse.redirect(`${base}/dashboard/integrations?connected=${provider}`);
    }

    // Production token exchange placeholder — wire SQUARE_CLIENT_SECRET / TOAST_CLIENT_SECRET when ready
    await upsertIntegration(restaurantId, provider as IntegrationProvider, {
      accessToken: code,
      externalAccountId: `oauth-${provider}`,
      accountName: `${provider} connected`,
    });
    return NextResponse.redirect(`${base}/dashboard/integrations?connected=${provider}`);
  } catch {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=connect_failed`);
  }
}
