import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminPhone } from "@/lib/admin";
import { loginSchema } from "@/lib/validation/operations";
import {
  COOKIE_SESSION,
  cookieOptions,
  createSessionToken,
  sessionCookieMaxAge,
} from "@/lib/auth-tokens";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  accessCookieMaxAge,
  refreshCookieMaxAge,
} from "@/lib/jwt";
import { issueTokenPair } from "@/lib/auth/refresh-tokens";
import { connectDb } from "@/lib/mongodb";
import { UserModel, RestaurantModel, doc } from "@/lib/models";
import { normalizePhoneDigits } from "@/lib/phone";
import { toJsonString } from "@/lib/db/json-fields";
import { ensureTenantForUser } from "@/lib/enterprise/tenant";
import { syncUserToPrisma } from "@/lib/prisma-client";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const limited = rateLimit(`login:${clientIp}`, 15, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Çox cəhd. ${limited.retryAfter}s sonra yenidən cəhd edin.` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bütün sahələr mütləqdir." }, { status: 400 });
    }
    const { firstName, lastName, phone: rawPhone, password } = parsed.data;
    const phone = normalizePhoneDigits(rawPhone.trim());

    const db = await connectDb();
    if (!db) {
      return NextResponse.json(
        { error: "Serverdə MONGODB_URI təyin edilməyib. Vercel Environment Variables yoxlayın." },
        { status: 503 },
      );
    }

    let user = doc(await UserModel.findOne({ phone }).lean());

    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      const created = await UserModel.create({
        firstName,
        lastName,
        phone,
        password: passwordHash,
      });
      user = doc(created.toObject())!;

      const hasRestaurant = await RestaurantModel.exists({ userId: user.id });
      if (!hasRestaurant) {
        await RestaurantModel.create({
          userId: user.id,
          name: `${firstName} Restaurant`,
          address: "Bakı, Azərbaycan",
          city: "Baku",
          openingHours: "10:00 – 22:00",
          phone,
          email: `${firstName.toLowerCase()}@metavision.az`,
          currency: "AZN",
          cuisine: toJsonString(["Azerbaijani"]),
          paymentMethods: toJsonString(["card", "cash"]),
        });
      }
    } else {
      if (typeof user.password !== "string" || !user.password) {
        await UserModel.findByIdAndUpdate(user.id, {
          $set: { password: await bcrypt.hash(password, 10) },
        });
      } else {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return NextResponse.json({ error: "Parol yanlışdır." }, { status: 401 });
        }
      }
    }

    const restaurantDoc = await RestaurantModel.findOne({ userId: user.id }).lean();
    if (restaurantDoc) {
      await ensureTenantForUser(user.id, String(restaurantDoc._id), String(user.firstName), String(user.phone));
    }

    void syncUserToPrisma({
      phone: String(user.phone),
      firstName: String(user.firstName),
      lastName: String(user.lastName),
      email: user.email != null ? String(user.email) : null,
      password: typeof user.password === "string" ? user.password : null,
      role: user.role != null ? String(user.role) : undefined,
    });

    const sessionUser = {
      firstName: String(user.firstName),
      lastName: String(user.lastName),
      phone: String(user.phone),
    };

    const sessionToken = await createSessionToken(sessionUser);
    const { accessToken, refreshToken } = await issueTokenPair(user.id, sessionUser);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_SESSION, sessionToken, {
      ...cookieOptions,
      maxAge: sessionCookieMaxAge,
    });
    cookieStore.set(COOKIE_ACCESS, accessToken, {
      ...cookieOptions,
      maxAge: accessCookieMaxAge,
    });
    cookieStore.set(COOKIE_REFRESH, refreshToken, {
      ...cookieOptions,
      maxAge: refreshCookieMaxAge,
    });

    return NextResponse.json({
      ok: true,
      redirect: isAdminPhone(phone) ? "/select-panel" : "/dashboard/orders",
      canChoosePanel: isAdminPhone(phone),
    });
  } catch (err) {
    console.error("Login error:", err);
    const msg = err instanceof Error ? err.message : "";
    const dbDown =
      msg.includes("querySrv") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("MONGODB_URI") ||
      msg.includes("Server selection timed out");
    return NextResponse.json(
      {
        error: dbDown
          ? "Verilənlər bazasına qoşulmaq alınmadı. Terminalda: npm run dev:clean"
          : "Giriş alınmadı.",
      },
      { status: 500 },
    );
  }
}
