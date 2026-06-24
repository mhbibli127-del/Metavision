export const META_GRAPH_VERSION = "v21.0";

export type MetaAdsRange = "7d" | "14d" | "30d" | "90d";

export type MetaAdAccount = {
  id: string;
  name: string;
  account_status?: number;
  currency?: string;
};

export type MetaInsightRow = {
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
};

export type MetaAdsDashboardPayload = {
  connected: boolean;
  configured: boolean;
  connection: {
    adAccountId: string;
    adAccountName: string | null;
    currency: string;
    status: string;
    lastSyncedAt: string | null;
    lastError: string | null;
  } | null;
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversions: number;
    roas: number | null;
  };
  campaigns: MetaInsightRow[];
  range: MetaAdsRange;
  source: "live" | "cache" | "import";
  trendContext?: {
    hashtags: string[];
    headlines: string[];
    updatedAt: string;
  };
};

export type MetaOAuthState = {
  restaurantId: string;
  exp: number;
};
