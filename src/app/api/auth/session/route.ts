import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSION, readSessionToken } from "@/lib/auth-tokens";

export async function GET() {
  const cookieStore = await cookies();
  const session = await readSessionToken(cookieStore.get(COOKIE_SESSION)?.value);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      firstName: session.firstName,
      lastName: session.lastName,
      phone: session.phone,
    },
  });
}
