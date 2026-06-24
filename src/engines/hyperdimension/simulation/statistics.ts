import type { ExperimentResult } from "../types";
import { isFiniteNumber, safeDiv } from "./numerics";

export function mean(arr: number[]): number {
  const v = arr.filter(isFiniteNumber);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

export function variance(arr: number[]): number {
  const v = arr.filter(isFiniteNumber);
  if (v.length < 2) return 0;
  const m = mean(v);
  return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1);
}

export function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i]! - ma;
    const xb = b[i]! - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export type BatchAnalysis = {
  count: number;
  means: Record<string, number>;
  variances: Record<string, number>;
  correlations: Record<string, number>;
  anomalies: Array<{ experimentId: number; metric: string; zScore: number }>;
  criticalTransitions: Array<{ parameter: string; threshold: number; metricJump: number }>;
  regimeCounts: Record<string, number>;
};

function col(results: ExperimentResult[], key: string): number[] {
  return results.map((r) => Number(r[key])).filter(isFiniteNumber);
}

export function analyzeBatch(
  results: ExperimentResult[],
  options?: { lite?: boolean },
): BatchAnalysis {
  const metrics = ["maxW", "minW", "averageW", "varianceW", "energy", "stabilityScore", "singularityRisk"];
  const means: Record<string, number> = {};
  const variances: Record<string, number> = {};

  for (const m of metrics) {
    const c = col(results, m);
    means[m] = mean(c);
    variances[m] = variance(c);
  }

  const correlations: Record<string, number> = {
    alpha_vs_varianceW: correlation(col(results, "alpha"), col(results, "varianceW")),
    superShift_vs_maxW: correlation(col(results, "superShift"), col(results, "maxW")),
    speed3D_vs_trajectory: correlation(col(results, "speed3D"), col(results, "trajectoryDeviation")),
    warp4D_vs_energy: correlation(col(results, "warp4D"), col(results, "energy")),
  };

  const anomalies: BatchAnalysis["anomalies"] = [];
  if (!options?.lite) {
    for (const m of metrics) {
      const c = col(results, m);
      const mu = mean(c);
      const sd = stdDev(c) || 1e-9;
      results.forEach((r, i) => {
        const v = Number(r[m]);
        if (!isFiniteNumber(v)) return;
        const z = Math.abs((v - mu) / sd);
        if (z > 3) anomalies.push({ experimentId: Number(r.experimentId ?? i + 1), metric: m, zScore: z });
      });
    }
  }

  const criticalTransitions: BatchAnalysis["criticalTransitions"] = [];
  const sorted = [...results].sort((a, b) => Number(a.alpha) - Number(b.alpha));
  for (let i = 1; i < sorted.length; i++) {
    const jump = Math.abs(Number(sorted[i]!.varianceW) - Number(sorted[i - 1]!.varianceW));
    if (jump > mean(col(results, "varianceW")) * 0.5) {
      criticalTransitions.push({
        parameter: "alpha",
        threshold: Number(sorted[i]!.alpha),
        metricJump: jump,
      });
    }
  }

  const regimeCounts: Record<string, number> = {};
  for (const r of results) {
    const reg = String(r.regime ?? "stable");
    regimeCounts[reg] = (regimeCounts[reg] ?? 0) + 1;
  }

  return {
    count: results.length,
    means,
    variances,
    correlations,
    anomalies,
    criticalTransitions,
    regimeCounts,
  };
}

export function generateReport(
  results: ExperimentResult[],
  analysis: BatchAnalysis | null,
  _law: unknown,
  options?: { lite?: boolean },
): Record<string, unknown> {
  const a = analysis ?? analyzeBatch(results, options);
  const failedRuns = results.filter(
    (r) => (r.warnings as string[] | undefined)?.some((w) => w.includes("NON-SENSITIVE")),
  );
  const interestingPatterns: string[] = [];
  if (Math.abs(a.correlations.alpha_vs_varianceW ?? 0) > 0.4) {
    interestingPatterns.push(`alpha–varianceW coupling r=${(a.correlations.alpha_vs_varianceW ?? 0).toFixed(3)}`);
  }
  if (Math.abs(a.correlations.superShift_vs_maxW ?? 0) > 0.35) {
    interestingPatterns.push(`superShift affects maxW (r=${(a.correlations.superShift_vs_maxW ?? 0).toFixed(3)})`);
  }
  if (a.criticalTransitions.length) {
    interestingPatterns.push(`${a.criticalTransitions.length} critical transition candidate(s) on alpha sweep`);
  }

  const avgStability = mean(col(results, "stabilityScore"));
  const avgEnergyErr = mean(col(results, "energyConservationError"));
  const inputSensitivityScore = Math.max(
    0,
    100 - failedRuns.length * safeDiv(100, results.length, 0),
  );
  const physicsValidityScore = Math.max(0, avgStability - avgEnergyErr * 0.5);

  const recommendations: string[] = [];
  if (failedRuns.length > results.length * 0.1) {
    recommendations.push("Fix input sensitivity — >10% runs insensitive to parameter changes");
  }
  if (avgEnergyErr > 5) {
    recommendations.push("Energy conservation drift elevated — review damping layer");
  }
  if (!interestingPatterns.length) {
    recommendations.push("No strong coupling patterns — widen parameter grid or increase simulation steps");
  }
  recommendations.push("Treat outputs as simulation hypotheses — not claims of new physics");

  return {
    interestingPatterns,
    anomalies: a.anomalies.slice(0, 20),
    failedRuns: failedRuns.map((r) => r.experimentId),
    recommendations,
    physics_validity_score: physicsValidityScore,
    input_sensitivity_score: inputSensitivityScore,
    model_reliability_assessment:
      physicsValidityScore > 75 && inputSensitivityScore > 80
        ? "reliable for parametric exploration"
        : "use with caution — validation gaps detected",
    regime_counts: a.regimeCounts,
    universal_law_found: false,
  };
}

export function toCSV(results: ExperimentResult[]): string {
  if (!results.length) return "";
  const keys = Object.keys(results[0]!).filter((k) => k !== "warnings" && k !== "wHistory");
  const header = keys.join(",");
  const rows = results.map((r) =>
    keys
      .map((k) => {
        const v = r[k];
        if (Array.isArray(v)) return `"${JSON.stringify(v)}"`;
        return String(v ?? "");
      })
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export function toJSON(results: ExperimentResult[], meta?: Record<string, unknown>): string {
  return JSON.stringify({ meta, count: results.length, results }, null, 2);
}
