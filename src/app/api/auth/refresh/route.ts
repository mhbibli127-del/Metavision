import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_SESSION,
  cookieOptions,
  readSessionToken,
} from "@/lib/auth-tokens";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  accessCookieMaxAge,
  refreshCookieMaxAge,
} from "@/lib/jwt";
import { rotateRefreshToken } from "@/lib/auth/refresh-tokens";
import { getDbUser } from "@/lib/db/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refresh = cookieStore.get(COOKIE_REFRESH)?.value;
    const session = await readSessionToken(cookieStore.get(COOKIE_SESSION)?.value);
    const user = await getDbUser();

    if (!refresh || !session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, refreshToken } = await rotateRefreshToken(refresh, user.id, session);

    cookieStore.set(COOKIE_ACCESS, accessToken, {
      ...cookieOptions,
      maxAge: accessCookieMaxAge,
    });
    cookieStore.set(COOKIE_REFRESH, refreshToken, {
      ...cookieOptions,
      maxAge: refreshCookieMaxAge,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
