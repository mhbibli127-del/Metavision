import { NextResponse } from "next/server";
import { getHyperdimensionEngine } from "@/engines/hyperdimension";

export async function GET() {
  const engine = getHyperdimensionEngine();
  await engine.initialize();

  return NextResponse.json({
    engine: "MetavisionBrain",
    module: "hyperdimension",
    status: "active",
    integrated_into: "Metavision",
    registry: Object.keys(engine.getRegistry()),
    execution_graph: engine.getExecutionGraph(),
    context: engine.getContext(),
    endpoints: {
      run: "POST /api/engines/hyperdimension/run",
      infer: "POST /api/engines/hyperdimension/infer",
      validate: "POST /api/engines/hyperdimension/validate",
      report: "POST /api/engines/hyperdimension/report",
      analyze: "POST /api/features/hyperdimension/analyze",
    },
  });
}
