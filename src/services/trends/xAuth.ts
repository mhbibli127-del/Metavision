import crypto from "node:crypto";
import axios from "axios";

let cachedOAuthBearer: { token: string; exp: number } | null = null;

export function getDirectXBearerToken(): string | null {
  const raw = process.env.X_BEARER_TOKEN ?? "";
  if (!raw.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

export function getXAccessCredentials(): {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
} | null {
  const consumerKey = process.env.X_API_KEY?.trim();
  const consumerSecret = process.env.X_API_SECRET?.trim();
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET?.trim();
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) return null;
  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** OAuth 1.0a user-context — required for some v1.1 endpoints on Basic tier */
export function buildOAuth1AuthorizationHeader(method: string, url: string): string | null {
  const creds = getXAccessCredentials();
  if (!creds) return null;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const urlObj = new URL(url);
  const allParams: Record<string, string> = { ...oauthParams };
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key]!)}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(`${urlObj.origin}${urlObj.pathname}`),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(creds.consumerSecret)}&${percentEncode(creds.accessTokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauthParams.oauth_signature = signature;

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((key) => `${percentEncode(key)}="${percentEncode(oauthParams[key]!)}"`)
      .join(", ")
  );
}

/** OAuth2 client_credentials from X_API_KEY + X_API_SECRET */
export async function fetchXOAuthBearer(): Promise<string> {
  const key = process.env.X_API_KEY?.trim();
  const secret = process.env.X_API_SECRET?.trim();
  if (!key || !secret) {
    throw new Error("X_API_KEY + X_API_SECRET required for OAuth bearer");
  }

  if (cachedOAuthBearer && cachedOAuthBearer.exp > Date.now()) {
    return cachedOAuthBearer.token;
  }

  const basic = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await axios.post(
    "https://api.twitter.com/oauth2/token",
    "grant_type=client_credentials",
    {
      timeout: 12_000,
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const token = String(res.data?.access_token ?? "");
  if (!token) throw new Error("X OAuth2 token response empty");

  const expiresIn = Number(res.data?.expires_in ?? 7200);
  cachedOAuthBearer = { token, exp: Date.now() + (expiresIn - 60) * 1000 };
  return token;
}

/** Bearer candidates: OAuth2 app token, then static bearer */
export async function getXBearerCandidates(): Promise<string[]> {
  const out: string[] = [];
  const direct = getDirectXBearerToken();
  if (direct) out.push(direct);
  try {
    const oauth = await fetchXOAuthBearer();
    if (!out.includes(oauth)) out.push(oauth);
  } catch {
    /* optional */
  }
  if (!out.length) throw new Error("X_BEARER_TOKEN or X_API_KEY + X_API_SECRET required");
  return out;
}
