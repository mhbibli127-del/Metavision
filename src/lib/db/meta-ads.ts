import { connectDb } from "@/lib/mongodb";
import { MetaAdsConnectionModel, MetaAdsInsightModel, doc, docs } from "@/lib/models";
import { getUserRestaurant } from "@/lib/db/session";
import { toJsonString } from "@/lib/db/json-fields";
import { getMetaConfig } from "@/lib/meta-ads/config";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchAccountInsights,
  fetchAdAccounts,
  fetchMetaUserId,
  rangeToDates,
} from "@/lib/meta-ads/client";
import type { MetaAdsDashboardPayload, MetaAdsRange, MetaInsightRow } from "@/lib/meta-ads/types";
import { parseMetaAdsExport } from "@/lib/meta-ads/parse-export";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

function emptySummary() {
  return {
    spend: 0,
    impressions: 0,
    clicks: 0,
    reach: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    conversions: 0,
    roas: null as number | null,
  };
}

function aggregateSummary(rows: MetaInsightRow[]) {
  if (!rows.length) return emptySummary();
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const reach = rows.reduce((s, r) => s + r.reach, 0);
  const conversions = rows.reduce((s, r) => s + r.conversions, 0);
  const roasValues = rows.map((r) => r.roas).filter((v): v is number => v != null && v > 0);
  const roas = roasValues.length ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length : null;
  return {
    spend: Math.round(spend * 100) / 100,
    impressions,
    clicks,
    reach,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
    cpm: impressions > 0 ? Math.round((spend / impressions) * 1000 * 100) / 100 : 0,
    conversions: Math.round(conversions),
    roas: roas != null ? Math.round(roas * 100) / 100 : null,
  };
}

export async function getMetaConnectionForRestaurant(restaurantId: string) {
  await connectDb();
  const connection = doc(await MetaAdsConnectionModel.findOne({ restaurantId }).lean());
  if (!connection) return null;
  const insights = docs(
    await MetaAdsInsightModel.find({ connectionId: connection.id }).sort({ spend: -1 }).limit(50).lean(),
  );
  return { ...connection, insights };
}

function conn(c: { id: string } & Record<string, unknown>) {
  return {
    id: c.id,
    adAccountId: String(c.adAccountId),
    adAccountName: c.adAccountName != null ? String(c.adAccountName) : null,
    accessToken: decryptSecret(String(c.accessToken)),
    currency: c.currency != null ? String(c.currency) : "USD",
    status: String(c.status),
    lastSyncedAt: c.lastSyncedAt,
    lastError: c.lastError != null ? String(c.lastError) : null,
  };
}

export async function connectFromOAuthCode(code: string, restaurantId: string) {
  const short = await exchangeCodeForToken(code);
  const long = await exchangeForLongLivedToken(short.access_token);
  const accessToken = long.access_token;
  const metaUserId = await fetchMetaUserId(accessToken);

  const accounts = await fetchAdAccounts(accessToken);
  const active = accounts.filter((a) => (a.account_status ?? 1) === 1);
  const { systemAdAccountId } = getMetaConfig();
  const picked =
    active.find((a) => a.id === systemAdAccountId || a.id === `act_${systemAdAccountId}`) ??
    active[0];

  if (!picked) {
    throw new Error("Meta Ads hesabı tapılmadı. Ads Manager-da aktiv reklam hesabınız olduğundan əmin olun.");
  }

  const adAccountId = picked.id.startsWith("act_") ? picked.id : `act_${picked.id}`;
  const expiresAt = long.expires_in
    ? new Date(Date.now() + long.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  await connectDb();
  return MetaAdsConnectionModel.findOneAndUpdate(
    { restaurantId },
    {
      $set: {
        metaUserId,
        adAccountId,
        adAccountName: picked.name,
        accessToken: encryptSecret(accessToken),
        tokenExpiresAt: expiresAt,
        currency: picked.currency ?? "USD",
        status: "connected",
        lastError: null,
      },
      $setOnInsert: { restaurantId },
    },
    { upsert: true, new: true },
  ).lean();
}

export async function connectFromSystemCredentials(restaurantId: string) {
  const { systemToken, systemAdAccountId } = getMetaConfig();
  if (!systemToken || !systemAdAccountId) {
    throw new Error("META_ACCESS_TOKEN və META_AD_ACCOUNT_ID konfiqurasiya edilməyib");
  }
  const adAccountId = systemAdAccountId.startsWith("act_")
    ? systemAdAccountId
    : `act_${systemAdAccountId}`;

  await connectDb();
  return MetaAdsConnectionModel.findOneAndUpdate(
    { restaurantId },
    {
      $set: {
        adAccountId,
        adAccountName: "System Ad Account",
        accessToken: systemToken,
        status: "connected",
        lastError: null,
      },
      $setOnInsert: { restaurantId },
    },
    { upsert: true, new: true },
  ).lean();
}

export async function syncMetaInsights(restaurantId: string, range: MetaAdsRange = "30d") {
  await connectDb();
  const raw = doc(await MetaAdsConnectionModel.findOne({ restaurantId }).lean());
  if (!raw) throw new Error("Meta Ads bağlantısı yoxdur");
  const connection = conn(raw);
  if (connection.status === "import") {
    throw new Error("CSV import rejimində API sync yoxdur. Yeni export yükləyin.");
  }

  const { since, until } = rangeToDates(range);
  const dateStart = new Date(`${since}T00:00:00.000Z`);
  const dateEnd = new Date(`${until}T23:59:59.999Z`);

  try {
    const live = await fetchAccountInsights(connection.adAccountId, connection.accessToken, since, until);

    await MetaAdsInsightModel.deleteMany({
      connectionId: connection.id,
      dateStart,
      dateEnd,
    });

    const rows = [
      ...live.account.map((r) => ({ ...r, level: "account" as const })),
      ...live.campaigns.map((r) => ({ ...r, level: "campaign" as const })),
    ];

    if (rows.length) {
      await MetaAdsInsightModel.insertMany(
        rows.map((r) => ({
          connectionId: connection.id,
          level: r.level,
          entityId: r.entityId,
          entityName: r.entityName,
          dateStart,
          dateEnd,
          spend: r.spend,
          impressions: r.impressions,
          clicks: r.clicks,
          reach: r.reach,
          ctr: r.ctr,
          cpc: r.cpc,
          cpm: r.cpm,
          conversions: r.conversions,
          roas: r.roas,
          status: r.status ?? null,
          rawPayload: toJsonString(r),
        })),
      );
    }

    await MetaAdsConnectionModel.findByIdAndUpdate(connection.id, {
      $set: { lastSyncedAt: new Date(), lastError: null, status: "connected" },
    });

    return { synced: rows.length, range };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    await MetaAdsConnectionModel.findByIdAndUpdate(connection.id, {
      $set: { lastError: message, status: "error" },
    });
    throw err;
  }
}

export async function getMetaAdsDashboard(
  range: MetaAdsRange = "30d",
  sync = false,
): Promise<MetaAdsDashboardPayload> {
  const restaurant = await getUserRestaurant();
  const configured = getMetaConfig().isConfigured || getMetaConfig().hasSystemCredentials;

  if (!restaurant) {
    return {
      connected: false,
      configured,
      connection: null,
      summary: emptySummary(),
      campaigns: [],
      range,
      source: "cache",
    };
  }

  let connection = await getMetaConnectionForRestaurant(restaurant.id);

  if (!connection && getMetaConfig().hasSystemCredentials) {
    await connectFromSystemCredentials(restaurant.id);
    connection = await getMetaConnectionForRestaurant(restaurant.id);
  }

  if (!connection) {
    return {
      connected: false,
      configured,
      connection: null,
      summary: emptySummary(),
      campaigns: [],
      range,
      source: "cache",
    };
  }

  if (sync) {
    await syncMetaInsights(restaurant.id, range);
    connection = await getMetaConnectionForRestaurant(restaurant.id);
  }

  const { since, until } = rangeToDates(range);
  const dateStart = new Date(`${since}T00:00:00.000Z`);
  const dateEnd = new Date(`${until}T23:59:59.999Z`);

  const c = conn(connection! as { id: string } & Record<string, unknown>);
  const isImport = c.status === "import";

  const cached = docs(
    await MetaAdsInsightModel.find(
      isImport
        ? { connectionId: c.id, level: "campaign" }
        : { connectionId: c.id, level: "campaign", dateStart, dateEnd },
    )
      .sort({ spend: -1 })
      .lean(),
  );

  const campaigns: MetaInsightRow[] = cached.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      entityId: String(row.entityId),
      entityName: String(row.entityName),
      spend: Number(row.spend),
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
      reach: Number(row.reach),
      ctr: Number(row.ctr),
      cpc: Number(row.cpc),
      cpm: Number(row.cpm),
      conversions: Number(row.conversions),
      roas: row.roas != null ? Number(row.roas) : null,
      status: row.status != null ? String(row.status) : undefined,
    };
  });

  const accountRow = await MetaAdsInsightModel.findOne(
    isImport
      ? { connectionId: c.id, level: "account" }
      : { connectionId: c.id, level: "account", dateStart, dateEnd },
  ).lean();

  const summary = accountRow
    ? (() => {
        const a = accountRow as Record<string, unknown>;
        return {
          spend: Number(a.spend),
          impressions: Number(a.impressions),
          clicks: Number(a.clicks),
          reach: Number(a.reach),
          ctr: Number(a.ctr),
          cpc: Number(a.cpc),
          cpm: Number(a.cpm),
          conversions: Number(a.conversions),
          roas: a.roas != null ? Number(a.roas) : null,
        };
      })()
    : aggregateSummary(campaigns);

  return {
    connected: true,
    configured,
    connection: {
      adAccountId: c.adAccountId,
      adAccountName: c.adAccountName,
      currency: c.currency,
      status: c.status,
      lastSyncedAt: c.lastSyncedAt ? new Date(String(c.lastSyncedAt)).toISOString() : null,
      lastError: c.lastError,
    },
    summary,
    campaigns,
    range,
    source: c.status === "import" ? "import" : cached.length ? "cache" : "live",
  };
}

export async function importMetaAdsCsv(
  csvText: string,
  range: MetaAdsRange = "30d",
  currency = "AZN",
) {
  const restaurant = await getUserRestaurant();
  if (!restaurant) throw new Error("Restaurant not found");
  const parsed = parseMetaAdsExport(csvText);
  const { since, until } = rangeToDates(range);
  const dateStart = new Date(`${since}T00:00:00.000Z`);
  const dateEnd = new Date(`${until}T23:59:59.999Z`);

  await connectDb();
  const connection = doc(
    (
      await MetaAdsConnectionModel.findOneAndUpdate(
        { restaurantId: restaurant.id },
        {
          $set: {
            adAccountId: "csv-import",
            adAccountName: "Meta Ads Manager (CSV)",
            accessToken: "import",
            currency: parsed.currency ?? currency,
            status: "import",
            lastError: null,
            lastSyncedAt: new Date(),
          },
          $setOnInsert: { restaurantId: restaurant.id },
        },
        { upsert: true, new: true },
      )
    ).toObject(),
  )!;

  await MetaAdsInsightModel.deleteMany({ connectionId: connection.id });

  const summary = aggregateSummary(parsed.campaigns);

  const rows = [
    {
      level: "account" as const,
      entityId: "account-total",
      entityName: "Account total",
      ...summary,
      roas: summary.roas,
      status: undefined,
    },
    ...parsed.campaigns.map((c) => ({ ...c, level: "campaign" as const })),
  ];

  await MetaAdsInsightModel.insertMany(
    rows.map((r) => ({
      connectionId: connection.id,
      level: r.level,
      entityId: r.entityId,
      entityName: r.entityName,
      dateStart,
      dateEnd,
      spend: r.spend,
      impressions: r.impressions,
      clicks: r.clicks,
      reach: r.reach,
      ctr: r.ctr,
      cpc: r.cpc,
      cpm: r.cpm,
      conversions: r.conversions,
      roas: r.roas ?? null,
      status: r.status ?? null,
      rawPayload: toJsonString(r),
    })),
  );

  return getMetaAdsDashboard(range, false);
}

export async function connectWithManualToken(
  accessToken: string,
  adAccountId: string,
  currency = "AZN",
) {
  const restaurant = await getUserRestaurant();
  if (!restaurant) throw new Error("Restaurant not found");
  const adId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  await connectDb();
  await MetaAdsConnectionModel.findOneAndUpdate(
    { restaurantId: restaurant.id },
    {
      $set: {
        adAccountId: adId,
        adAccountName: "Manual token",
        accessToken: encryptSecret(accessToken),
        currency,
        status: "connected",
        lastError: null,
      },
      $setOnInsert: { restaurantId: restaurant.id },
    },
    { upsert: true },
  );

  await syncMetaInsights(restaurant.id, "30d");
  return getMetaAdsDashboard("30d", false);
}

export async function disconnectMetaAds(restaurantId: string) {
  await connectDb();
  await MetaAdsConnectionModel.deleteMany({ restaurantId });
}
