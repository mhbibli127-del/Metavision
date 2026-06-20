import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_PENDING,
  cookieOptions,
  createPendingToken,
  generateOtp,
  pendingCookieMaxAge,
  readPendingToken,
} from "@/lib/auth-tokens";
import { sendWhatsAppOtp } from "@/lib/whatsapp";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get(COOKIE_PENDING)?.value;
    const pending = await readPendingToken(pendingToken);

    if (!pending) {
      return NextResponse.json({ error: "OTP sessiyası tapılmadı." }, { status: 401 });
    }

    const otp = generateOtp();
    const nextToken = await createPendingToken(
      {
        firstName: pending.firstName,
        lastName: pending.lastName,
        phone: pending.phone,
      },
      otp,
    );

    const whatsapp = await sendWhatsAppOtp(pending.phone, otp);

    cookieStore.set(COOKIE_PENDING, nextToken, {
      ...cookieOptions,
      maxAge: pendingCookieMaxAge,
    });

    return NextResponse.json({
      ok: true,
      channel: "whatsapp",
      demo: whatsapp.demo ?? false,
      ...(whatsapp.demo && process.env.NODE_ENV === "development" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kod yenidən göndərilmədi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
