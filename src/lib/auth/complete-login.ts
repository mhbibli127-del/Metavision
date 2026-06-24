import { connectDb } from "@/lib/mongodb";
import { UserModel, RestaurantModel, doc } from "@/lib/models";
import { normalizePhoneDigits } from "@/lib/phone";
import { toJsonString } from "@/lib/db/json-fields";
import { ensureTenantForUser } from "@/lib/enterprise/tenant";
import { syncUserToPrisma } from "@/lib/prisma-client";
import { resolvePlatformRole } from "@/lib/platform-roles";
import { isAdminPhone } from "@/lib/admin";
import { cookies } from "next/headers";
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
import bcrypt from "bcryptjs";

export async function completeUserLogin(
  firstName: string,
  lastName: string,
  phone: string,
  passwordPlain: string,
): Promise<{ redirect: string; canChoosePanel: boolean }> {
  const normalizedPhone = normalizePhoneDigits(phone.trim());
  await connectDb();

  let user = doc(await UserModel.findOne({ phone: normalizedPhone }).lean());

  if (!user) {
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const created = await UserModel.create({
      firstName,
      lastName,
      phone: normalizedPhone,
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
        phone: normalizedPhone,
        email: `${firstName.toLowerCase()}@metavision.az`,
        currency: "AZN",
        cuisine: toJsonString(["Azerbaijani"]),
        paymentMethods: toJsonString(["card", "cash"]),
      });
    }
  } else if (typeof user.password !== "string" || !user.password) {
    await UserModel.findByIdAndUpdate(user.id, {
      $set: { password: await bcrypt.hash(passwordPlain, 10) },
    });
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
    role: resolvePlatformRole({ phone: String(user.phone), role: user.role != null ? String(user.role) : undefined }),
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

  const platformRole = resolvePlatformRole({ phone: normalizedPhone, role: user!.role != null ? String(user!.role) : undefined });

  return {
    redirect: platformRole === "super_admin" ? "/admin" : "/dashboard/command-center",
    canChoosePanel: platformRole === "super_admin",
  };
}

/** OTP-verified login — phone ownership proven via WhatsApp code. */
export async function completeUserLoginFromOtp(
  firstName: string,
  lastName: string,
  phone: string,
  passwordHash: string,
): Promise<{ redirect: string; canChoosePanel: boolean }> {
  const normalizedPhone = normalizePhoneDigits(phone.trim());
  await connectDb();

  let user = doc(await UserModel.findOne({ phone: normalizedPhone }).lean());

  if (!user) {
    const hash = passwordHash || (await bcrypt.hash(crypto.randomUUID(), 10));
    const created = await UserModel.create({
      firstName,
      lastName,
      phone: normalizedPhone,
      password: hash,
    });
    user = doc(created.toObject())!;

    await RestaurantModel.create({
      userId: user.id,
      name: `${firstName} Restaurant`,
      address: "Bakı, Azərbaycan",
      city: "Baku",
      openingHours: "10:00 – 22:00",
      phone: normalizedPhone,
      email: `${firstName.toLowerCase()}@metavision.az`,
      currency: "AZN",
      cuisine: toJsonString(["Azerbaijani"]),
      paymentMethods: toJsonString(["card", "cash"]),
    });
  }

  const restaurantDoc = await RestaurantModel.findOne({ userId: user!.id }).lean();
  if (restaurantDoc) {
    await ensureTenantForUser(user!.id, String(restaurantDoc._id), String(user!.firstName), String(user!.phone));
  }

  void syncUserToPrisma({
    phone: String(user!.phone),
    firstName: String(user!.firstName),
    lastName: String(user!.lastName),
    email: user!.email != null ? String(user!.email) : null,
    password: typeof user!.password === "string" ? user!.password : null,
    role: user!.role != null ? String(user!.role) : undefined,
  });

  const sessionUser = {
    firstName: String(user!.firstName),
    lastName: String(user!.lastName),
    phone: String(user!.phone),
    role: resolvePlatformRole({ phone: String(user!.phone), role: user!.role != null ? String(user!.role) : undefined }),
  };

  const sessionToken = await createSessionToken(sessionUser);
  const { accessToken, refreshToken } = await issueTokenPair(user!.id, sessionUser);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSION, sessionToken, { ...cookieOptions, maxAge: sessionCookieMaxAge });
  cookieStore.set(COOKIE_ACCESS, accessToken, { ...cookieOptions, maxAge: accessCookieMaxAge });
  cookieStore.set(COOKIE_REFRESH, refreshToken, { ...cookieOptions, maxAge: refreshCookieMaxAge });

  const platformRole = resolvePlatformRole({ phone: normalizedPhone, role: user!.role != null ? String(user!.role) : undefined });

  return {
    redirect: platformRole === "super_admin" ? "/admin" : "/dashboard/command-center",
    canChoosePanel: platformRole === "super_admin",
  };
}
