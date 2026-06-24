/**
 * Server-side trend API key resolution.
 * Supports canonical names (TIKTOK_API_KEY, etc.) with legacy aliases.
 */

export type TrendsEnv = {
  tiktokKey: string | null;
  googleKey: string | null;
  xKey: string | null;
  xSecret: string | null;
  xBearer: string | null;
  newsKey: string | null;
  rapidApiKey: string | null;
};

const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[trends-env] ${message}`);
}

function pick(...values: Array<string | undefined>): string | null {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return null;
}

function decodeBearer(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

export function getTrendsEnv(): TrendsEnv {
  const tiktokKey = pick(process.env.TIKTOK_API_KEY, process.env.RAPIDAPI_KEY);
  const googleKey = pick(process.env.GOOGLE_API_KEY);
  const xKey = pick(process.env.X_API_KEY);
  const xSecret = pick(process.env.X_API_SECRET);
  const xBearer = decodeBearer(process.env.X_BEARER_TOKEN);
  const newsKey = pick(process.env.NEWS_API_KEY);
  const rapidApiKey = pick(process.env.RAPIDAPI_KEY, process.env.TIKTOK_API_KEY);

  if (!tiktokKey) warnOnce("tiktok", "TIKTOK_API_KEY / RAPIDAPI_KEY is missing — TikTok will use fallback data");
  if (!googleKey) warnOnce("google", "GOOGLE_API_KEY is missing — Google Trends will use mock/fallback data");
  if (!xKey && !xBearer && !(xKey && xSecret)) {
    warnOnce("x", "X_API_KEY or X_BEARER_TOKEN is missing — X trends will use fallback data");
  }
  if (!newsKey && !rapidApiKey) {
    warnOnce("news", "NEWS_API_KEY / RAPIDAPI_KEY is missing — news will use fallback headlines");
  }

  return { tiktokKey, googleKey, xKey, xSecret, xBearer, newsKey, rapidApiKey };
}
