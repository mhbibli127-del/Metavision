import { NextResponse } from "next/server";
import { getServerWebSocketConfig } from "@/lib/ws-config";

/** Runtime WebSocket config for the browser (reads server env including AI_BACKEND_URL). */
export async function GET() {
  const { enabled, httpBase } = getServerWebSocketConfig();
  return NextResponse.json({ enabled, httpBase });
}
