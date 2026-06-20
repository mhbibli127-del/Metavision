import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { maskPhone } from "@/lib/auth";
import { COOKIE_PENDING, readPendingToken } from "@/lib/auth-tokens";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export async function GET() {
  const cookieStore = await cookies();
  const pending = await readPendingToken(cookieStore.get(COOKIE_PENDING)?.value);

  if (!pending) {
    return NextResponse.json({ error: "OTP sessiyası tapılmadı." }, { status: 401 });
  }

  return NextResponse.json({
    phone: maskPhone(pending.phone),
    channel: "whatsapp",
    demo: !isWhatsAppConfigured(),
  });
}
