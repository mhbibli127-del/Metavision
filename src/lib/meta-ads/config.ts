import { META_GRAPH_VERSION } from "./types";

export function getMetaConfig() {
  const appId = process.env.META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/meta-ads/callback`;

  const systemToken = process.env.META_ACCESS_TOKEN ?? "";
  const systemAdAccountId = process.env.META_AD_ACCOUNT_ID ?? "";

  return {
    appId,
    appSecret,
    redirectUri,
    graphBase: `https://graph.facebook.com/${META_GRAPH_VERSION}`,
    oauthBase: `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`,
    scopes: ["ads_read", "read_insights", "business_management"],
    systemToken,
    systemAdAccountId,
    isConfigured: Boolean(appId && appSecret),
    hasSystemCredentials: Boolean(systemToken && systemAdAccountId),
  };
}

export function isMetaConfigured() {
  const c = getMetaConfig();
  return c.isConfigured || c.hasSystemCredentials;
}
