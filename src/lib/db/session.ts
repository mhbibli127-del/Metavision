import { cookies } from "next/headers";
import { COOKIE_SESSION, readSessionToken } from "@/lib/auth-tokens";
import { normalizePhoneDigits } from "@/lib/phone";
import { tryConnectDb } from "@/lib/mongodb";
import { UserModel, RestaurantModel, MenuItemModel, MembershipModel, BranchModel, doc, docs } from "@/lib/models";

export type SessionUser = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type DbUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  password?: string | null;
  language?: string;
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
  role?: string;
};

export type DbRestaurant = {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  openingHours: string;
  phone: string;
  email: string;
  website?: string | null;
  parking?: string | null;
  amenities?: string | null;
  activeCampaigns?: string | null;
  paymentMethods: string;
  imageName?: string | null;
  currency: string;
  cuisine: string;
  menuItems?: { id: string; name: string; price: number; category: string; available: boolean }[];
};

function toDbUser(raw: ({ id: string } & Record<string, unknown>) | null): DbUser | null {
  if (!raw) return null;
  return {
    id: raw.id,
    firstName: String(raw.firstName),
    lastName: String(raw.lastName),
    phone: String(raw.phone),
    email: raw.email != null ? String(raw.email) : null,
    password: typeof raw.password === "string" ? raw.password : null,
    language: raw.language != null ? String(raw.language) : undefined,
    emailNotifications: Boolean(raw.emailNotifications),
    whatsappNotifications: Boolean(raw.whatsappNotifications),
    role: raw.role != null ? String(raw.role) : undefined,
  };
}

function toDbRestaurant(raw: ({ id: string } & Record<string, unknown>) | null): DbRestaurant | null {
  if (!raw) return null;
  return {
    id: raw.id,
    userId: String(raw.userId),
    name: String(raw.name),
    address: String(raw.address),
    city: String(raw.city),
    openingHours: String(raw.openingHours),
    phone: String(raw.phone),
    email: String(raw.email),
    website: raw.website != null ? String(raw.website) : null,
    parking: raw.parking != null ? String(raw.parking) : null,
    amenities: raw.amenities != null ? String(raw.amenities) : null,
    activeCampaigns: raw.activeCampaigns != null ? String(raw.activeCampaigns) : null,
    paymentMethods: String(raw.paymentMethods ?? "[]"),
    imageName: raw.imageName != null ? String(raw.imageName) : null,
    currency: String(raw.currency ?? "AZN"),
    cuisine: String(raw.cuisine ?? "[]"),
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(COOKIE_SESSION)?.value);
}

export async function getDbUser(): Promise<DbUser | null> {
  const session = await getSession();
  if (!session) return null;

  if (!(await tryConnectDb())) return null;
  const phone = normalizePhoneDigits(session.phone);
  return toDbUser(doc(await UserModel.findOne({ phone }).lean() as { _id: string } & Record<string, unknown>));
}

export async function getUserRestaurant(): Promise<DbRestaurant | null> {
  const user = await getDbUser();
  if (!user) return null;

  if (!(await tryConnectDb())) return null;

  const membership = await MembershipModel.findOne({ userId: user.id }).lean();
  let restaurantRaw = null as ({ _id: string } & Record<string, unknown>) | null;

  if (membership?.branchId) {
    const branch = await BranchModel.findById(membership.branchId).lean();
    if (branch?.restaurantId) {
      restaurantRaw = await RestaurantModel.findById(branch.restaurantId).lean() as typeof restaurantRaw;
    }
  }
  if (!restaurantRaw) {
    restaurantRaw = await RestaurantModel.findOne({ userId: user.id }).sort({ createdAt: 1 }).lean() as typeof restaurantRaw;
  }

  const restaurant = toDbRestaurant(doc(restaurantRaw));
  if (!restaurant) return null;

  const menuItems = docs(
    await MenuItemModel.find({ restaurantId: restaurant.id })
      .select("name price category available order")
      .sort({ order: 1 })
      .lean(),
  );

  return {
    ...restaurant,
    menuItems: menuItems.map((m) => ({
      id: m.id,
      name: String(m.name),
      price: Number(m.price),
      category: String(m.category),
      available: Boolean(m.available),
    })),
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireRestaurant() {
  const restaurant = await getUserRestaurant();
  if (!restaurant) throw new Error("Restaurant not found");
  return restaurant;
}
