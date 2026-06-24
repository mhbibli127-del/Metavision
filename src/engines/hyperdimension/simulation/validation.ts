import type { ExperimentResult } from "../types";
import { mean, stdDev } from "./statistics";
import { probeInputSensitivity } from "./physics";

export function computeBatchAssessment(results: ExperimentResult[]): Record<string, unknown> {
  if (!results.length) {
    return {
      physics_validity_score: 0,
      input_sensitivity_score: 0,
      model_reliability_assessment: "no data",
      isPhysicallyValid: false,
    };
  }

  const stability = results.map((r) => Number(r.stabilityScore)).filter(Number.isFinite);
  const energyErr = results.map((r) => Number(r.energyConservationError)).filter(Number.isFinite);
  const sensitive = results.filter(
    (r) => !(r.warnings as string[] | undefined)?.some((w) => w.includes("NON-SENSITIVE")),
  );

  const physics_validity_score = Math.max(
    0,
    mean(stability) - mean(energyErr) * 0.5,
  );
  const input_sensitivity_score = (sensitive.length / results.length) * 100;

  const constantOutputs = detectConstantOutputs(results);

  return {
    physics_validity_score,
    momentumConservationScore: Math.max(0, 100 - mean(energyErr) * 3),
    stabilityIndex: mean(stability),
    causalityScore: input_sensitivity_score,
    input_sensitivity_score,
    physicalValidity: physics_validity_score > 60 && input_sensitivity_score > 70,
    isPhysicallyValid: physics_validity_score > 60 && constantOutputs.length === 0,
    constant_output_flags: constantOutputs,
    model_reliability_assessment:
      constantOutputs.length > 0
        ? "NON-PHYSICAL BEHAVIOR DETECTED — constant outputs"
        : input_sensitivity_score < 70
          ? "NON-SENSITIVE MODEL BUG risk"
          : "acceptable for exploratory simulation",
  };
}

function detectConstantOutputs(results: ExperimentResult[]): string[] {
  const flags: string[] = [];
  const metrics = ["maxW", "minW", "averageW", "varianceW"] as const;
  for (const m of metrics) {
    const vals = results.map((r) => Number(r[m]));
    if (vals.length < 3) continue;
    if (stdDev(vals) < 1e-9) flags.push(`${m} constant across batch`);
  }
  return flags;
}

export function validateSingleConfig(cfg: Record<string, number>): Record<string, unknown> {
  const sens = probeInputSensitivity(cfg);
  return {
    input_sensitive: sens.sensitive,
    warnings: sens.warnings,
    non_sensitive: !sens.sensitive,
  };
}

export function computeBatchAssessmentFromConfig(cfg: Record<string, number>) {
  return validateSingleConfig(cfg);
}
