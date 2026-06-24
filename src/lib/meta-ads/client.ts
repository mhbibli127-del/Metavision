import { getMetaConfig } from "./config";
import type { MetaAdAccount } from "./types";

type GraphError = { error?: { message?: string; type?: string; code?: number } };

async function graphGet<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  const { graphBase } = getMetaConfig();
  const url = new URL(`${graphBase}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as T & GraphError;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta API error (${res.status})`);
  }
  return json;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in?: number }> {
  const { graphBase, appId, appSecret, redirectUri } = getMetaConfig();
  const url = new URL(`${graphBase}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as { access_token: string; expires_in?: number } & GraphError;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? "Token exchange failed");
  }
  return json;
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in?: number }> {
  const { graphBase, appId, appSecret } = getMetaConfig();
  const url = new URL(`${graphBase}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as { access_token: string; expires_in?: number } & GraphError;
  if (!res.ok || json.error) {
    return { access_token: shortToken };
  }
  return json;
}

export async function fetchMetaUserId(accessToken: string): Promise<string> {
  const data = await graphGet<{ id: string }>("/me", accessToken, { fields: "id" });
  return data.id;
}

export async function fetchAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const data = await graphGet<{ data: MetaAdAccount[] }>("/me/adaccounts", accessToken, {
    fields: "id,name,account_status,currency",
    limit: "50",
  });
  return data.data ?? [];
}

type RawInsight = {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: { action_type: string; value: string }[];
  purchase_roas?: { value: string }[];
  effective_status?: string;
};

function num(v: string | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function extractConversions(actions?: { action_type: string; value: string }[]): number {
  if (!actions?.length) return 0;
  const preferred = ["purchase", "omni_purchase", "lead", "complete_registration", "link_click"];
  for (const type of preferred) {
    const hit = actions.find((a) => a.action_type === type);
    if (hit) return num(hit.value);
  }
  return num(actions[0]?.value);
}

function extractRoas(purchase_roas?: { value: string }[]): number | null {
  if (!purchase_roas?.length) return null;
  const v = num(purchase_roas[0]?.value);
  return v > 0 ? v : null;
}

export function mapInsightRow(row: RawInsight): {
  entityId: string;
  entityName: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number | null;
  status?: string;
} {
  return {
    entityId: row.campaign_id ?? "account",
    entityName: row.campaign_name ?? "Account total",
    spend: num(row.spend),
    impressions: Math.round(num(row.impressions)),
    clicks: Math.round(num(row.clicks)),
    reach: Math.round(num(row.reach)),
    ctr: num(row.ctr),
    cpc: num(row.cpc),
    cpm: num(row.cpm),
    conversions: extractConversions(row.actions),
    roas: extractRoas(row.purchase_roas),
    status: row.effective_status,
  };
}

export async function fetchAccountInsights(
  adAccountId: string,
  accessToken: string,
  since: string,
  until: string,
) {
  const accountPath = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const timeRange = JSON.stringify({ since, until });

  const accountData = await graphGet<{ data: RawInsight[] }>(`/${accountPath}/insights`, accessToken, {
    fields: "spend,impressions,clicks,reach,ctr,cpc,cpm,actions,cost_per_action_type,purchase_roas",
    time_range: timeRange,
    level: "account",
  });

  const campaignData = await graphGet<{ data: RawInsight[] }>(`/${accountPath}/insights`, accessToken, {
    fields:
      "campaign_id,campaign_name,spend,impressions,clicks,reach,ctr,cpc,cpm,actions,purchase_roas,effective_status",
    time_range: timeRange,
    level: "campaign",
    limit: "100",
  });

  return {
    account: (accountData.data ?? []).map(mapInsightRow),
    campaigns: (campaignData.data ?? []).map(mapInsightRow),
  };
}

export function rangeToDates(range: string): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  const days = range === "7d" ? 7 : range === "14d" ? 14 : range === "90d" ? 90 : 30;
  since.setDate(until.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { since: fmt(since), until: fmt(until) };
}
