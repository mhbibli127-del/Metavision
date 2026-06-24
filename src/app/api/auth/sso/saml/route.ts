import { NextResponse } from "next/server";
import { buildSamlLoginUrl, getSamlConfig } from "@/lib/auth/sso-saml";
import { cookies } from "next/headers";

const COOKIE_SAML_STATE = "mv_saml_state";

export async function GET() {
  const config = getSamlConfig();
  if (!config) {
    return NextResponse.json({ error: "SAML SSO not configured" }, { status: 503 });
  }
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SAML_STATE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(buildSamlLoginUrl(config));
}
