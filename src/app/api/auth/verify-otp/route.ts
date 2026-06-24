import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_PENDING,
  verifyPendingOtp,
} from "@/lib/auth-tokens";
import { completeUserLoginFromOtp } from "@/lib/auth/complete-login";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { otp?: string };
    const otp = String(body.otp ?? "").trim();

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Kod 6 rəqəmli olmalıdır." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const pendingToken = cookieStore.get(COOKIE_PENDING)?.value;
    const pending = await verifyPendingOtp(pendingToken, otp);

    if (!pending) {
      return NextResponse.json({ error: "Kod yanlışdır və ya vaxtı bitib." }, { status: 401 });
    }

    const result = await completeUserLoginFromOtp(
      pending.firstName,
      pending.lastName,
      pending.phone,
      pending.passwordHash ?? "",
    );

    cookieStore.delete(COOKIE_PENDING);

    return NextResponse.json({
      ok: true,
      redirect: result.redirect,
      canChoosePanel: result.canChoosePanel,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Təsdiq alınmadı." }, { status: 500 });
  }
}
