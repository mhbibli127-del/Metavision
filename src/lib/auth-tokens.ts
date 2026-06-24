import type { AdminSessionPayload, PendingPayload, SessionPayload } from "@/lib/auth-types";

export const COOKIE_SESSION = "mv_session";
export const COOKIE_PENDING = "mv_pending";
export const COOKIE_ADMIN_SESSION = "mv_admin_session";

const OTP_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "metavision-dev-secret-change-me";
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64url");
}

function fromBase64Url(value: string): ArrayBuffer {
  const bytes = Buffer.from(value, "base64url");
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function sign(data: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(signature);
}

async function verifySignature(data: string, signature: string): Promise<boolean> {
  const key = await getHmacKey();
  try {
    return crypto.subtle.verify("HMAC", key, fromBase64Url(signature), new TextEncoder().encode(data));
  } catch {
    return false;
  }
}

async function encodeToken<T extends object>(payload: T): Promise<string> {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${await sign(data)}`;
}

async function decodeToken<T extends object>(token: string): Promise<T | null> {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  if (!(await verifySignature(data, signature))) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function encodeSignedPayload<T extends object>(payload: T): Promise<string> {
  return encodeToken(payload);
}

export async function decodeSignedPayload<T extends object>(token: string): Promise<T | null> {
  return decodeToken<T>(token);
}

export async function hashOtp(otp: string): Promise<string> {
  const key = await getHmacKey();
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`otp:${otp}`));
  return toBase64Url(digest);
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createPendingToken(
  user: Omit<PendingPayload, "otpHash" | "exp">,
  otp: string,
): Promise<string> {
  return encodeToken<PendingPayload>({
    ...user,
    otpHash: await hashOtp(otp),
    exp: Date.now() + OTP_TTL_MS,
  });
}

export async function createSessionToken(user: Omit<SessionPayload, "exp">): Promise<string> {
  return encodeToken<SessionPayload>({
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  });
}

export async function createAdminSessionToken(
  user: Omit<AdminSessionPayload, "exp">,
): Promise<string> {
  return encodeToken<AdminSessionPayload>({
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  });
}

export async function readPendingToken(token: string | undefined): Promise<PendingPayload | null> {
  if (!token) return null;
  const payload = await decodeToken<PendingPayload>(token);
  if (!payload || payload.exp < Date.now()) return null;
  return payload;
}

export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const payload = await decodeToken<SessionPayload>(token);
  if (!payload || payload.exp < Date.now()) return null;
  return payload;
}

export async function readAdminSessionToken(
  token: string | undefined,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const payload = await decodeToken<AdminSessionPayload>(token);
  if (!payload || payload.exp < Date.now()) return null;
  return payload;
}

export async function verifyPendingOtp(
  token: string | undefined,
  otp: string,
): Promise<PendingPayload | null> {
  const payload = await readPendingToken(token);
  if (!payload) return null;
  if ((await hashOtp(otp.trim())) !== payload.otpHash) return null;
  return payload;
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const pendingCookieMaxAge = OTP_TTL_MS / 1000;
export const sessionCookieMaxAge = SESSION_TTL_MS / 1000;
