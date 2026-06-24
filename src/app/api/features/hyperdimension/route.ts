import { NextResponse } from "next/server";
import { getFeatureBrainEngine } from "@/features/hyperdimension";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    module: "hyperdimension",
    role: "FeatureBrainEngine",
    integrated_into: "Metavision.features.hyperdimension",
    endpoints: {
      analyze: "POST /api/features/hyperdimension/analyze",
    },
    capabilities: [
      "dashboard_metrics",
      "business_insights",
      "manager_recommendations",
      "ui_payload_generation",
    ],
    cache_ttl_seconds: 60,
  });
}

export async function POST() {
  const engine = getFeatureBrainEngine();
  const output = await engine.analyze();
  return NextResponse.json(output);
}
