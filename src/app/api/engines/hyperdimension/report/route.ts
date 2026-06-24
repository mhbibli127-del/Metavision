import { NextResponse } from "next/server";
import { getHyperdimensionEngine } from "@/engines/hyperdimension";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { maxCombos?: number };
    const engine = getHyperdimensionEngine();
    const output = await engine.exportReport({ maxCombos: body.maxCombos ?? 200 });
    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report failed";
    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
