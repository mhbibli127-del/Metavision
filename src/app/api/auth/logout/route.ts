import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ADMIN_SESSION, COOKIE_PENDING, COOKIE_SESSION } from "@/lib/auth-tokens";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/jwt";
import { revokeRefreshToken } from "@/lib/auth/refresh-tokens";

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(COOKIE_REFRESH)?.value;
  if (refresh) await revokeRefreshToken(refresh).catch(() => {});
  cookieStore.delete(COOKIE_SESSION);
  cookieStore.delete(COOKIE_ACCESS);
  cookieStore.delete(COOKIE_REFRESH);
  cookieStore.delete(COOKIE_PENDING);
  cookieStore.delete(COOKIE_ADMIN_SESSION);
  return NextResponse.json({ ok: true });
}
