const RAILWAY_WS_DEFAULT = "wss://courageous-forgiveness-production.up.railway.app";

/** Resolve WebSocket base URL — never use localhost on deployed sites. */
export function resolveWebSocketBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_WS_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? RAILWAY_WS_DEFAULT : "");
  if (!raw) return null;

  const httpBase = raw
    .replace(/^ws:\/\//i, "http://")
    .replace(/^wss:\/\//i, "https://")
    .replace(/\/tastemind\/?$/i, "")
    .replace(/\/$/, "");

  if (!httpBase) return null;

  const pointsToLocalhost = /(^|\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(httpBase);

  if (typeof window !== "undefined") {
    const pageHost = window.location.hostname;
    const pageIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";
    if (pointsToLocalhost && !pageIsLocal) {
      return null;
    }
  } else if (process.env.NODE_ENV === "production" && pointsToLocalhost) {
    return null;
  }

  return httpBase;
}
