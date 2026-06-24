import { connectDb } from "@/lib/mongodb";
import { IntegrationConnectionModel, doc, docs } from "@/lib/models";
import { requireRestaurant } from "@/lib/db/session";

export type IntegrationProvider = "square" | "toast";

export type IntegrationConnection = {
  id: string;
  provider: IntegrationProvider;
  status: string;
  accountName?: string;
  externalAccountId?: string;
};

export async function listIntegrations(): Promise<IntegrationConnection[]> {
  const restaurant = await requireRestaurant();
  await connectDb();
  return docs(
    await IntegrationConnectionModel.find({ restaurantId: restaurant.id }).lean(),
  ).map((row) => ({
    id: row.id,
    provider: row.provider as IntegrationProvider,
    status: String(row.status),
    accountName: row.accountName ? String(row.accountName) : undefined,
    externalAccountId: row.externalAccountId ? String(row.externalAccountId) : undefined,
  }));
}

export async function upsertIntegration(
  restaurantId: string,
  provider: IntegrationProvider,
  data: { accessToken?: string; refreshToken?: string; externalAccountId?: string; accountName?: string },
) {
  await connectDb();
  const row = doc(
    await IntegrationConnectionModel.findOneAndUpdate(
      { restaurantId, provider },
      {
        $set: {
          status: "connected",
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          externalAccountId: data.externalAccountId,
          accountName: data.accountName,
        },
      },
      { upsert: true, new: true },
    ).lean(),
  );
  return row;
}

export function getOAuthAuthorizeUrl(provider: IntegrationProvider, state: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${base}/api/integrations/oauth/${provider}/callback`;

  if (provider === "square") {
    const clientId = process.env.SQUARE_CLIENT_ID;
    if (!clientId) {
      return `${base}/api/integrations/oauth/square/callback?demo=1&state=${state}`;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "MERCHANT_PROFILE_READ ORDERS_READ ITEMS_READ",
      session: "false",
      state,
      redirect_uri: redirectUri,
    });
    return `https://connect.squareup.com/oauth2/authorize?${params}`;
  }

  if (provider === "toast") {
    const clientId = process.env.TOAST_CLIENT_ID;
    if (!clientId) {
      return `${base}/api/integrations/oauth/toast/callback?demo=1&state=${state}`;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      state,
    });
    return `https://toast.com/oauth/authorize?${params}`;
  }

  return `${base}/dashboard/integrations`;
}
