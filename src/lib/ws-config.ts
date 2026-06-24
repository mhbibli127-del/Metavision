/**
 * WebSocket config — server reads AI_BACKEND_URL at runtime (no rebuild needed for URL).
 * Client fetches /api/realtime/config (see fetchWebSocketConfig).
 */
export type WsConfigState = "disabled" | "ready";

export function normalizeWsBaseUrl(raw: string): string | null {
  const httpBase = raw
    .replace(/^ws:\/\//i, "http://")
    .replace(/^wss:\/\//i, "https://")
    .replace(/\/tastemind\/?$/i, "")
    .replace(/\/$/, "");

  return httpBase || null;
}

/** Server + build-time: is realtime enabled? */
export function isWebSocketEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_WS === "true" ||
    process.env.ENABLE_WS === "true"
  );
}

function pickRawWsUrlFromEnv(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_WS_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.AI_BACKEND_URL?.trim() ||
    undefined
  );
}

/** Server-side config (API routes) — includes AI_BACKEND_URL fallback */
export function getServerWebSocketConfig(): { enabled: boolean; httpBase: string | null } {
  const enabled = isWebSocketEnabled();
  if (!enabled) return { enabled: false, httpBase: null };

  const raw = pickRawWsUrlFromEnv();
  if (!raw) return { enabled: true, httpBase: null };

  return { enabled: true, httpBase: normalizeWsBaseUrl(raw) };
}

export function getWebSocketConfigState(): WsConfigState {
  const { enabled, httpBase } = getServerWebSocketConfig();
  if (!enabled || !httpBase) return "disabled";
  return "ready";
}

/** Client-only legacy (prefer fetchWebSocketConfig) */
export function resolveWebSocketBaseUrl(): string | null {
  if (typeof window === "undefined") return null;

  const { enabled, httpBase } = getServerWebSocketConfig();
  if (!enabled || !httpBase) return null;

  const pointsToLocalhost = /(^|\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(httpBase);
  const pageHost = window.location.hostname;
  const pageIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";
  if (pointsToLocalhost && !pageIsLocal) return null;

  return httpBase;
}

export type WebSocketClientConfig = {
  enabled: boolean;
  httpBase: string | null;
};

/** Runtime config from server — works after Vercel env change + redeploy (or ENABLE_WS without NEXT_PUBLIC URL) */
export async function fetchWebSocketConfig(): Promise<WebSocketClientConfig> {
  const res = await fetch("/api/realtime/config", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return { enabled: false, httpBase: null };
  return res.json() as Promise<WebSocketClientConfig>;
}

function isLocalhostUrl(httpBase: string): boolean {
  return /(^|\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(httpBase);
}

export function isWsUrlAllowedOnClient(httpBase: string): boolean {
  const pageHost = window.location.hostname;
  const pageIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";
  if (isLocalhostUrl(httpBase) && !pageIsLocal) return false;
  return true;
}
