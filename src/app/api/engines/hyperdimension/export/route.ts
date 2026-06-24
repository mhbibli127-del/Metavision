import { NextResponse } from "next/server";
import { getHyperdimensionEngine } from "@/engines/hyperdimension";
import { loadHyperdimensionModules } from "@/engines/hyperdimension/loader";
import type { HyperdimensionConfig } from "@/engines/hyperdimension";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      format?: "json" | "csv";
      mode?: "train" | "single";
      config?: HyperdimensionConfig;
      maxCombos?: number;
    };

    const mods = await loadHyperdimensionModules();
    const engine = getHyperdimensionEngine();
    const format = body.format ?? "json";

    let results;
    if (body.mode === "single" && body.config) {
      const out = await engine.run(body.config);
      results = out.results ?? [];
    } else {
      const out = await engine.train({ maxCombos: body.maxCombos ?? 500 });
      results = out.results ?? [];
    }

    const meta = {
      exportedAt: new Date().toISOString(),
      count: results.length,
      engine: "hyperdimension",
    };

    if (format === "csv") {
      const csv = mods.statistics.toCSV(results);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hyperdimension-${Date.now()}.csv"`,
        },
      });
    }

    const json = mods.statistics.toJSON(results, meta);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="hyperdimension-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
