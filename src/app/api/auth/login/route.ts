import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminPhone } from "@/lib/admin";
import {
  COOKIE_SESSION,
  cookieOptions,
  createSessionToken,
  sessionCookieMaxAge,
} from "@/lib/auth-tokens";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      password?: string;
    };

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!firstName || !lastName || !phone || !password) {
      return NextResponse.json({ error: "Bütün sahələr mütləqdir." }, { status: 400 });
    }

    const sessionToken = await createSessionToken({ firstName, lastName, phone });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_SESSION, sessionToken, {
      ...cookieOptions,
      maxAge: sessionCookieMaxAge,
    });

    return NextResponse.json({
      ok: true,
      redirect: isAdminPhone(phone) ? "/select-panel" : "/dashboard/orders",
      canChoosePanel: isAdminPhone(phone),
    });
  } catch {
    return NextResponse.json({ error: "Giriş alınmadı." }, { status: 500 });
  }
}
