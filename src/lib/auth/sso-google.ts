import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const COOKIE_STATE = "mv_oauth_state";

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/sso/google/callback`,
  };
}

export async function setOAuthState(): Promise<string> {
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_STATE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return state;
}

export async function verifyOAuthState(state: string | null): Promise<boolean> {
  const cookieStore = await cookies();
  const expected = cookieStore.get(COOKIE_STATE)?.value;
  cookieStore.delete(COOKIE_STATE);
  return Boolean(state && expected && state === expected);
}

export function buildGoogleAuthUrl(state: string, config: NonNullable<ReturnType<typeof getGoogleOAuthConfig>>) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(
  code: string,
  config: NonNullable<ReturnType<typeof getGoogleOAuthConfig>>,
) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("Token exchange failed");
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("No access token");

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Profile fetch failed");
  return profileRes.json() as Promise<{
    email?: string;
    given_name?: string;
    family_name?: string;
    id?: string;
  }>;
}
