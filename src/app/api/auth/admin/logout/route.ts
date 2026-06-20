import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ADMIN_SESSION } from "@/lib/auth-tokens";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ADMIN_SESSION);
  return NextResponse.json({ ok: true });
}
