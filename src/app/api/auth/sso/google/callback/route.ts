import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDb } from "@/lib/mongodb";
import { UserModel, RestaurantModel, doc } from "@/lib/models";
import { isAdminPhone } from "@/lib/admin";
import {
  COOKIE_SESSION,
  cookieOptions,
  createSessionToken,
  sessionCookieMaxAge,
} from "@/lib/auth-tokens";
import { COOKIE_ACCESS, COOKIE_REFRESH, accessCookieMaxAge, refreshCookieMaxAge } from "@/lib/jwt";
import { issueTokenPair } from "@/lib/auth/refresh-tokens";
import { ensureTenantForUser } from "@/lib/enterprise/tenant";
import { syncUserToPrisma } from "@/lib/prisma-client";
import { exchangeGoogleCode, getGoogleOAuthConfig, verifyOAuthState } from "@/lib/auth/sso-google";

export async function GET(request: Request) {
  const config = getGoogleOAuthConfig();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!config) {
    return NextResponse.redirect(`${appUrl}/login?error=sso_not_configured`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=sso_denied`);
  }

  if (!(await verifyOAuthState(state))) {
    return NextResponse.redirect(`${appUrl}/login?error=sso_state`);
  }

  try {
    const profile = await exchangeGoogleCode(code, config);
    const email = profile.email;
    if (!email) throw new Error("No email from Google");

    await connectDb();
    let user = doc(await UserModel.findOne({ email }).lean());
    if (!user) {
      const phone = `google_${profile.id ?? email.replace(/[^a-z0-9]/gi, "")}`;
      const created = await UserModel.create({
        firstName: profile.given_name ?? "Google",
        lastName: profile.family_name ?? "User",
        phone,
        email,
        role: "USER",
      });
      user = doc(created.toObject())!;
    }

    const restaurantDoc = await RestaurantModel.findOne({ userId: user.id }).lean();
    if (restaurantDoc) {
      await ensureTenantForUser(user.id, String(restaurantDoc._id), String(user.firstName), String(user.phone));
    }

    void syncUserToPrisma({
      phone: String(user.phone),
      firstName: String(user.firstName),
      lastName: String(user.lastName),
      email: user.email != null ? String(user.email) : null,
      role: user.role != null ? String(user.role) : undefined,
    });

    const sessionUser = {
      firstName: String(user.firstName),
      lastName: String(user.lastName),
      phone: String(user.phone),
    };
    const sessionToken = await createSessionToken(sessionUser);
    const { accessToken, refreshToken } = await issueTokenPair(user.id, sessionUser);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_SESSION, sessionToken, { ...cookieOptions, maxAge: sessionCookieMaxAge });
    cookieStore.set(COOKIE_ACCESS, accessToken, { ...cookieOptions, maxAge: accessCookieMaxAge });
    cookieStore.set(COOKIE_REFRESH, refreshToken, { ...cookieOptions, maxAge: refreshCookieMaxAge });

    const redirect = isAdminPhone(String(user.phone)) ? "/select-panel" : "/dashboard/orders";
    return NextResponse.redirect(`${appUrl}${redirect}`);
  } catch {
    return NextResponse.redirect(`${appUrl}/login?error=sso_failed`);
  }
}
