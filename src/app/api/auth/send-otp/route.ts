import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { maskPhone } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  COOKIE_PENDING,
  cookieOptions,
  createPendingToken,
  generateOtp,
  pendingCookieMaxAge,
} from "@/lib/auth-tokens";
import { sendWhatsAppOtp } from "@/lib/whatsapp";
import bcrypt from "bcryptjs";
import { normalizePhoneDigits } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const limited = rateLimit(`otp:${clientIp}`, 5, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Çox cəhd. ${limited.retryAfter}s sonra yenidən cəhd edin.` },
        { status: 429 },
      );
    }

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

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);
    const pendingToken = await createPendingToken(
      { firstName, lastName, phone: normalizePhoneDigits(phone), passwordHash },
      otp,
    );

    const whatsapp = await sendWhatsAppOtp(phone, otp);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_PENDING, pendingToken, {
      ...cookieOptions,
      maxAge: pendingCookieMaxAge,
    });

    return NextResponse.json({
      ok: true,
      phone: maskPhone(phone),
      channel: "whatsapp",
      demo: whatsapp.demo ?? false,
      ...(whatsapp.demo && process.env.NODE_ENV === "development" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTP göndərilmədi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
