import { NextResponse } from "next/server";
import { buildGoogleAuthUrl, getGoogleOAuthConfig, setOAuthState } from "@/lib/auth/sso-google";

export async function GET() {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return NextResponse.json({ error: "Google SSO not configured" }, { status: 503 });
  }
  const state = await setOAuthState();
  const url = buildGoogleAuthUrl(state, config);
  return NextResponse.redirect(url);
}
