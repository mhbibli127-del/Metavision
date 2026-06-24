import { NextResponse } from "next/server";
import { getFeatureBrainEngine } from "@/features/hyperdimension";
import type { MetavisionBusinessData } from "@/features/hyperdimension";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      data?: Partial<MetavisionBusinessData>;
      skipCache?: boolean;
      enableLabMode?: boolean;
    };

    const engine = getFeatureBrainEngine();
    const output = await engine.analyze(body.data, {
      skipCache: body.skipCache,
      enableLabMode: body.enableLabMode,
    });

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyze failed";
    return NextResponse.json(
      {
        status: "error",
        module: "hyperdimension",
        metrics: {},
        insights: [],
        recommendations: [],
        ui_payload: {},
        error: message,
      },
      { status: 500 },
    );
  }
}
