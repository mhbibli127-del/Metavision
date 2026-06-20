import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminPhone } from "@/lib/admin";
import { COOKIE_SESSION, readSessionToken } from "@/lib/auth-tokens";

export async function GET() {
  const cookieStore = await cookies();
  const session = await readSessionToken(cookieStore.get(COOKIE_SESSION)?.value);

  if (!session) {
    return NextResponse.json({ error: "Sessiya tapılmadı." }, { status: 401 });
  }

  return NextResponse.json({
    phone: session.phone,
    firstName: session.firstName,
    lastName: session.lastName,
    isAdminPhone: isAdminPhone(session.phone),
  });
}
