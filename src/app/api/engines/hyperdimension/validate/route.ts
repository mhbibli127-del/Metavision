import { NextResponse } from "next/server";
import { getHyperdimensionEngine } from "@/engines/hyperdimension";
import type { ExperimentResult } from "@/engines/hyperdimension";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { results?: ExperimentResult[] };
    const engine = getHyperdimensionEngine();
    const output = await engine.validate(body.results);
    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
