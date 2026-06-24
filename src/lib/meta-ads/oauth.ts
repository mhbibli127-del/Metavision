import { encodeSignedPayload, decodeSignedPayload } from "@/lib/auth-tokens";
import type { MetaOAuthState } from "./types";

const STATE_TTL_MS = 10 * 60 * 1000;

export async function createOAuthState(restaurantId: string): Promise<string> {
  const payload: MetaOAuthState = {
    restaurantId,
    exp: Date.now() + STATE_TTL_MS,
  };
  return encodeSignedPayload(payload);
}

export async function parseOAuthState(token: string): Promise<MetaOAuthState | null> {
  const payload = await decodeSignedPayload<MetaOAuthState>(token);
  if (!payload?.restaurantId || !payload.exp) return null;
  if (Date.now() > payload.exp) return null;
  return payload;
}

export function buildOAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID ?? "";
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/meta-ads/callback`;
  const scopes = ["ads_read", "read_insights", "business_management"].join(",");

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}
