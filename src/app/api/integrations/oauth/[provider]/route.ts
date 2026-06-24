import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAccess } from "@/lib/api/access";
import { getOAuthAuthorizeUrl, type IntegrationProvider } from "@/lib/db/integrations";
import { encodeSignedPayload } from "@/lib/auth-tokens";

const PROVIDERS: IntegrationProvider[] = ["square", "toast"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const ctx = await requireAccess("restaurant:write");
    const { provider } = await params;
    if (!PROVIDERS.includes(provider as IntegrationProvider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    const state = await encodeSignedPayload({
      restaurantId: ctx.restaurantId,
      provider,
      exp: Date.now() + 10 * 60 * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set("mv_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });

    const url = getOAuthAuthorizeUrl(provider as IntegrationProvider, state);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
