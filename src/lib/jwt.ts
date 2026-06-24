import type { SessionPayload } from "@/lib/auth-types";

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const COOKIE_ACCESS = "mv_access";
export const COOKIE_REFRESH = "mv_refresh";

export const accessCookieMaxAge = ACCESS_TTL_MS / 1000;
export const refreshCookieMaxAge = REFRESH_TTL_MS / 1000;

function secret(): string {
  return process.env.JWT_SECRET || process.env.AUTH_SECRET || "metavision-dev-secret-change-me";
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64url");
}

function fromB64url(v: string): ArrayBuffer {
  const bytes = Buffer.from(v, "base64url");
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function sign(data: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(data));
  return b64url(sig);
}

async function verify(data: string, signature: string): Promise<boolean> {
  try {
    return crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(signature), new TextEncoder().encode(data));
  } catch {
    return false;
  }
}

export type AccessPayload = SessionPayload & { typ: "access" };

export async function createAccessToken(user: Omit<SessionPayload, "exp">): Promise<string> {
  const payload: AccessPayload = { ...user, typ: "access", exp: Date.now() + ACCESS_TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${await sign(data)}`;
}

export async function verifyAccessToken(token: string | undefined): Promise<AccessPayload | null> {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig || !(await verify(data, sig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as AccessPayload;
    if (payload.typ !== "access" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export async function hashRefreshToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return b64url(digest);
}

export { REFRESH_TTL_MS };
