import { NextResponse } from "next/server";
import { getAiBackendUrl } from "@/lib/ai-backend-config";
import { getServerWebSocketConfig, isWebSocketEnabled } from "@/lib/ws-config";

/** Quick check: is NestJS up and is WS configured on this deployment? */
export async function GET() {
  const backend = getAiBackendUrl();
  const ws = getServerWebSocketConfig();
  let backendOk = false;
  let backendError: string | undefined;

  try {
    const res = await fetch(`${backend}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    backendOk = res.ok;
    if (!res.ok) backendError = `HTTP ${res.status}`;
  } catch (err) {
    backendError = err instanceof Error ? err.message : "unreachable";
  }

  return NextResponse.json({
    wsEnabled: isWebSocketEnabled(),
    wsConfigured: ws.enabled && Boolean(ws.httpBase),
    httpBase: ws.httpBase,
    backendUrl: backend,
    backendOk,
    backendError,
    hint: !isWebSocketEnabled()
      ? "Set NEXT_PUBLIC_ENABLE_WS=true (or ENABLE_WS=true) on Vercel and redeploy"
      : !ws.httpBase
        ? "Set AI_BACKEND_URL on Vercel (server env)"
        : !backendOk
          ? "Railway NestJS is down or URL wrong"
          : "Set Railway WS_ORIGIN to your Vercel domain",
  });
}
