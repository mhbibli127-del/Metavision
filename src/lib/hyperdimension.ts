import type { FeatureBrainOutput, MetavisionBusinessData } from "@/features/hyperdimension";

export type HyperdimensionAnalyzeRequest = {
  data?: Partial<MetavisionBusinessData>;
  skipCache?: boolean;
  enableLabMode?: boolean;
};

export async function analyzeHyperdimension(
  request: HyperdimensionAnalyzeRequest = {},
): Promise<FeatureBrainOutput> {
  const res = await fetch("/api/features/hyperdimension/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Hyperdimension analyze failed: ${res.status}`);
  }

  return res.json() as Promise<FeatureBrainOutput>;
}

export async function getHyperdimensionStatus() {
  const res = await fetch("/api/features/hyperdimension");
  if (!res.ok) throw new Error(`Hyperdimension status failed: ${res.status}`);
  return res.json();
}
