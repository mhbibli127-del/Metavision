import { NextResponse } from "next/server";
import { getAiBackendUrl } from "@/lib/ai-backend-config";
import { getWebSocketConfigState, isWebSocketEnabled } from "@/lib/ws-config";

/** Quick check: is NestJS up and is WS configured on this deployment? */
export async function GET() {
  const backend = getAiBackendUrl();
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
    wsConfigured: getWebSocketConfigState() === "ready",
    backendUrl: backend,
    backendOk,
    backendError,
    hint: !isWebSocketEnabled()
      ? "Set NEXT_PUBLIC_ENABLE_WS=true on Vercel and redeploy"
      : !backendOk
        ? "Railway NestJS is down or URL wrong — check AI_BACKEND_URL"
        : "Set Railway WS_ORIGIN to your Vercel domain",
  });
}
