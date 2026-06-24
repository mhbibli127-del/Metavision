import { NextResponse } from "next/server";

export async function GET() {
  console.log("[health] GET /api/health");
  return NextResponse.json({
    status: "ok",
    service: "metavision-backend",
    timestamp: new Date().toISOString(),
  });
}
