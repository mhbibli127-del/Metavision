import { tryConnectDb } from "@/lib/mongodb";
import {
  RestaurantModel,
  SubscriptionModel,
  MetaAdsConnectionModel,
  UserModel,
  doc,
} from "@/lib/models";
import { getDbUser } from "@/lib/db/session";

export async function fetchUserSettings() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  if (!(await tryConnectDb())) {
    return {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        language: user.language,
        emailNotifications: user.emailNotifications,
        whatsappNotifications: user.whatsappNotifications,
      },
      restaurant: null,
      subscription: null,
      integrations: {
        metaAds: { connected: false },
        aiBackend: Boolean(process.env.AI_BACKEND_URL),
      },
      intelligence: {
        predictionSensitivity: 78,
        alertCadenceMinutes: 15,
        advisorMode: "strategic",
        modules: ["taste-dna", "predictions", "market-intelligence", "meta-ads", "simulator"],
      },
    };
  }

  const restaurant = await RestaurantModel.findOne({ userId: user.id })
    .select("name city currency")
    .lean();
  const rest = restaurant as Record<string, unknown> | null;

  const subscription = await SubscriptionModel.findOne({ userId: user.id })
    .select("plan status")
    .lean();
  const sub = subscription as Record<string, unknown> | null;

  const metaConnected = rest
    ? await MetaAdsConnectionModel.findOne({ restaurantId: String(rest._id) })
        .select("status lastSyncedAt")
        .lean()
    : null;
  const meta = metaConnected as Record<string, unknown> | null;

  return {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      language: user.language,
      emailNotifications: user.emailNotifications,
      whatsappNotifications: user.whatsappNotifications,
    },
    restaurant: rest
      ? { name: String(rest.name), city: String(rest.city), currency: String(rest.currency) }
      : null,
    subscription: sub
      ? { plan: String(sub.plan).toLowerCase(), status: String(sub.status).toLowerCase() }
      : null,
    integrations: {
      metaAds: meta
        ? {
            connected: true,
            status: String(meta.status),
            lastSyncedAt: meta.lastSyncedAt,
          }
        : { connected: false },
      aiBackend: Boolean(process.env.AI_BACKEND_URL),
    },
    intelligence: {
      predictionSensitivity: 78,
      alertCadenceMinutes: 15,
      advisorMode: "strategic",
      modules: ["taste-dna", "predictions", "market-intelligence", "meta-ads", "simulator"],
    },
  };
}

export async function updateUserSettings(data: {
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
  language?: string;
}) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  if (!(await tryConnectDb())) throw new Error("Database unavailable");

  const updated = await UserModel.findByIdAndUpdate(
    user.id,
    {
      $set: {
        ...(data.emailNotifications !== undefined && { emailNotifications: data.emailNotifications }),
        ...(data.whatsappNotifications !== undefined && {
          whatsappNotifications: data.whatsappNotifications,
        }),
        ...(data.language !== undefined && { language: data.language }),
      },
    },
    { new: true },
  ).lean();

  return doc(updated);
}
