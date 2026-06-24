import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_SESSION,
  cookieOptions,
  readSessionToken,
  createSessionToken,
  sessionCookieMaxAge,
} from "@/lib/auth-tokens";
import { connectDb } from "@/lib/mongodb";
import { UserModel, doc } from "@/lib/models";
import { normalizePhoneDigits } from "@/lib/phone";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
      emailNotifications?: boolean;
      whatsappNotifications?: boolean;
      language?: string;
    };

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_SESSION)?.value;
    const session = await readSessionToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Session expired. Please login again." }, { status: 401 });
    }

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = normalizePhoneDigits(String(body.phone ?? "").trim());

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: "Ad, soyad və telefon mütləqdir." }, { status: 400 });
    }

    await connectDb();
    const dbUser = doc(
      await UserModel.findOne({ phone: normalizePhoneDigits(session.phone) }).lean(),
    );
    if (!dbUser) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı." }, { status: 404 });
    }

    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: "Cari şifrə tələb olunur." }, { status: 400 });
      }
      if (body.newPassword.length < 8) {
        return NextResponse.json({ error: "Yeni şifrə ən az 8 simvol olmalıdır." }, { status: 400 });
      }
      if (typeof dbUser.password === "string" && dbUser.password) {
        const valid = await bcrypt.compare(body.currentPassword, dbUser.password);
        if (!valid) {
          return NextResponse.json({ error: "Cari şifrə yanlışdır." }, { status: 401 });
        }
      }
    }

    await UserModel.findByIdAndUpdate(dbUser.id, {
      $set: {
        firstName,
        lastName,
        phone,
        ...(body.emailNotifications !== undefined && { emailNotifications: body.emailNotifications }),
        ...(body.whatsappNotifications !== undefined && {
          whatsappNotifications: body.whatsappNotifications,
        }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.newPassword ? { password: await bcrypt.hash(body.newPassword, 10) } : {}),
      },
    });

    const newSessionToken = await createSessionToken({ firstName, lastName, phone });

    cookieStore.set(COOKIE_SESSION, newSessionToken, {
      ...cookieOptions,
      maxAge: sessionCookieMaxAge,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil yenilənmədi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
