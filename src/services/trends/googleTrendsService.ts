import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { TrendPayload } from "./types";

const execFileAsync = promisify(execFile);
export const GOOGLE_CACHE_KEY = "google:trends";

export async function fetchGoogleTrends(geo = "AZ"): Promise<TrendPayload> {
  const script = path.join(process.cwd(), "scripts", "trends", "fetch_google_trends.py");
  const python = process.env.PYTHON_PATH ?? "python";

  try {
    const { stdout } = await execFileAsync(python, [script, geo], {
      timeout: 45_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout.trim()) as TrendPayload & { error?: string };
    if (parsed.error && (!parsed.trends || parsed.trends.length === 0)) {
      throw new Error(parsed.error);
    }
    return {
      source: "google",
      trends: parsed.trends ?? [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      meta: parsed.meta,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "pytrends failed";
    if (msg.includes("ENOENT") || msg.includes("not found")) {
      throw new Error("Python/pytrends not installed — run: pip install -r scripts/trends/requirements.txt");
    }
    throw err;
  }
}
