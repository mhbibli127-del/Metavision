import { NextResponse } from "next/server";
import { getHyperdimensionEngine } from "@/engines/hyperdimension";
import type { HyperdimensionConfig } from "@/engines/hyperdimension";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "single" | "batch" | "train";
      config?: HyperdimensionConfig;
      configs?: HyperdimensionConfig[];
      maxCombos?: number;
    };

    const engine = getHyperdimensionEngine();

    if (body.mode === "train") {
      const output = await engine.train({ maxCombos: body.maxCombos });
      return NextResponse.json(output);
    }

    if (body.configs?.length) {
      const output = await engine.run(body.configs);
      return NextResponse.json(output);
    }

    if (body.config) {
      const output = await engine.run(body.config);
      return NextResponse.json(output);
    }

    return NextResponse.json(
      { error: "Provide config, configs[], or mode: train" },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Run failed";
    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
