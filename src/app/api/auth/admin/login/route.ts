import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminPhone, verifyAdminPassword } from "@/lib/admin";
import {
  COOKIE_ADMIN_SESSION,
  COOKIE_SESSION,
  cookieOptions,
  createAdminSessionToken,
  readSessionToken,
  sessionCookieMaxAge,
} from "@/lib/auth-tokens";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      password?: string;
      phone?: string;
    };

    const password = String(body.password ?? "");
    const phone = String(body.phone ?? "").trim();

    if (!password || !phone) {
      return NextResponse.json({ error: "Nömrə və parol mütləqdir." }, { status: 400 });
    }

    if (!isAdminPhone(phone)) {
      return NextResponse.json({ error: "Bu nömrə admin panelinə giriş icazəsi almır." }, { status: 403 });
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Parol yanlışdır." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const userSession = await readSessionToken(cookieStore.get(COOKIE_SESSION)?.value);

    const adminToken = await createAdminSessionToken({
      email: "",
      phone,
      firstName: userSession?.firstName ?? "Admin",
      lastName: userSession?.lastName ?? "User",
    });

    cookieStore.set(COOKIE_ADMIN_SESSION, adminToken, {
      ...cookieOptions,
      maxAge: sessionCookieMaxAge,
    });

    return NextResponse.json({
      ok: true,
      redirect: "/admin",
    });
  } catch {
    return NextResponse.json({ error: "Admin girişi alınmadı." }, { status: 500 });
  }
}
