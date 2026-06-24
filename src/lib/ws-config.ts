/**
 * WebSocket base URL — only when explicitly enabled.
 * Set NEXT_PUBLIC_ENABLE_WS=true and NEXT_PUBLIC_WS_URL on Vercel when Railway WS is ready.
 */
export function resolveWebSocketBaseUrl(): string | null {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_WS === "true";
  const raw = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (!enabled || !raw) return null;

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
    if (pointsToLocalhost && !pageIsLocal) return null;
  } else if (process.env.NODE_ENV === "production" && pointsToLocalhost) {
    return null;
  }

  return httpBase;
}
