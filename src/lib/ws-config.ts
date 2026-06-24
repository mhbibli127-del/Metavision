/**
 * WebSocket base URL for Socket.IO (TasteMind /tastemind namespace).
 * Requires NEXT_PUBLIC_ENABLE_WS=true at build time on Vercel.
 */
export type WsConfigState = "disabled" | "ready";

export function isWebSocketEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_WS === "true";
}

function pickRawWsUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_WS_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    undefined
  );
}

function toHttpBase(raw: string): string | null {
  const httpBase = raw
    .replace(/^ws:\/\//i, "http://")
    .replace(/^wss:\/\//i, "https://")
    .replace(/\/tastemind\/?$/i, "")
    .replace(/\/$/, "");

  return httpBase || null;
}

export function resolveWebSocketBaseUrl(): string | null {
  if (typeof window === "undefined") return null;
  if (!isWebSocketEnabled()) return null;

  const raw = pickRawWsUrl();
  if (!raw) return null;

  const httpBase = toHttpBase(raw);
  if (!httpBase) return null;

  const pointsToLocalhost = /(^|\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(httpBase);
  const pageHost = window.location.hostname;
  const pageIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";

  if (pointsToLocalhost && !pageIsLocal) return null;

  return httpBase;
}

export function getWebSocketConfigState(): WsConfigState {
  if (!isWebSocketEnabled()) return "disabled";
  if (!pickRawWsUrl()) return "disabled";
  return "ready";
}
