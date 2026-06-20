import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ADMIN_SESSION, readAdminSessionToken } from "@/lib/auth-tokens";

export async function GET() {
  const cookieStore = await cookies();
  const admin = await readAdminSessionToken(cookieStore.get(COOKIE_ADMIN_SESSION)?.value);

  if (!admin) {
    return NextResponse.json({ admin: null }, { status: 401 });
  }

  return NextResponse.json({
    admin: {
      email: admin.email,
      phone: admin.phone,
      firstName: admin.firstName,
      lastName: admin.lastName,
    },
  });
}
