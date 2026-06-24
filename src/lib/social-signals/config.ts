import { getTrendsEnv } from "@/lib/trends/env";

export type SocialSourceStatus = {
  configured: boolean;
  label: string;
  detail?: string;
};

export function getSocialSignalsConfig() {
  const env = getTrendsEnv();
  const rapidApi = Boolean(env.rapidApiKey);
  const xBearer = Boolean(env.xBearer);
  const xOAuth = Boolean(env.xKey && env.xSecret);
  const xKeyOnly = Boolean(env.xKey);
  const newsDirect = Boolean(env.newsKey);
  const tiktok = Boolean(env.tiktokKey);
  const metaAds = Boolean(
    (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) ||
      (process.env.META_APP_ID && process.env.META_APP_SECRET),
  );

  return {
    rapidApi,
    x: xBearer || xOAuth || xKeyOnly,
    xBearer,
    xOAuth,
    news: newsDirect || rapidApi,
    metaAds,
    sources: {
      rapidapi: {
        configured: rapidApi,
        label: "RapidAPI",
        detail: rapidApi ? "TikTok, X, xəbər" : "TIKTOK_API_KEY / RAPIDAPI_KEY təyin edin",
      } satisfies SocialSourceStatus,
      x: {
        configured: xBearer || xOAuth || xKeyOnly || Boolean(process.env.X_ACCESS_TOKEN?.trim()),
        label: "X (Twitter / xAI)",
        detail: process.env.X_ACCESS_TOKEN
          ? "OAuth 1.0a user context"
          : xBearer
            ? "Bearer token"
            : xOAuth
              ? "API Key + Secret"
              : "X_API_KEY və ya X_BEARER_TOKEN",
      } satisfies SocialSourceStatus,
      tiktok: {
        configured: tiktok,
        label: "TikTok trends",
        detail: process.env.RAPIDAPI_TIKTOK_HOST ?? "mock + RapidAPI fallback",
      } satisfies SocialSourceStatus,
      google: {
        configured: Boolean(env.googleKey),
        label: "Google Trends",
        detail: env.googleKey ? "GOOGLE_API_KEY" : "mock fallback",
      } satisfies SocialSourceStatus,
      news: {
        configured: newsDirect || rapidApi,
        label: "Xəbərlər",
        detail: newsDirect ? "NewsAPI" : rapidApi ? "RapidAPI news" : "NEWS_API_KEY",
      } satisfies SocialSourceStatus,
      metaAds: {
        configured: metaAds,
        label: "Meta Ads",
        detail: metaAds ? "aktiv" : "deaktiv — sosial siqnallar",
      } satisfies SocialSourceStatus,
    },
  };
}
