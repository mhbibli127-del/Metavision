import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/auth/sso-google";
import { getSamlConfig } from "@/lib/auth/sso-saml";

export async function GET() {
  return NextResponse.json({
    google: Boolean(getGoogleOAuthConfig()),
    saml: Boolean(getSamlConfig()),
  });
}
