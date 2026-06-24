import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSamlConfig } from "@/lib/auth/sso-saml";

/** SAML ACS endpoint — wire full assertion validation when IdP cert is configured. */
export async function POST(request: Request) {
  const config = getSamlConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=sso_not_configured", request.url));
  }

  const form = await request.formData();
  const samlResponse = form.get("SAMLResponse");
  if (!samlResponse || typeof samlResponse !== "string") {
    return NextResponse.redirect(new URL("/login?error=sso_failed", request.url));
  }

  const cookieStore = await cookies();
  cookieStore.delete("mv_saml_state");

  // Production: validate signature with config.cert and extract NameID/email.
  // Scaffold: redirect to login with message until full SAML library is added.
  if (process.env.SAML_STRICT === "true") {
    return NextResponse.redirect(new URL("/login?error=sso_failed", request.url));
  }

  return NextResponse.redirect(new URL("/login?error=sso_saml_scaffold", request.url));
}
