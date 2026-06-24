import { BATCH_RANGES, BATCH_SIMULATION_STEPS, CONFIG, linspace, mergeConfig } from "./config";
import { probeInputSensitivity, runPhysicsSimulation } from "./physics";
import type { ExperimentResult } from "../types";

export type RunExperimentOptions = {
  skipSensitivityCheck?: boolean;
  skipLogging?: boolean;
  skipWarnings?: boolean;
  slim?: boolean;
  experimentId?: number | null;
};

let experimentCounter = 0;

export function runExperiment(
  rawCfg: Partial<typeof CONFIG>,
  options: RunExperimentOptions = {},
): ExperimentResult {
  const cfg = mergeConfig({
    ...rawCfg,
    simulationSteps: rawCfg.simulationSteps ?? CONFIG.simulationSteps,
  });
  const id = options.experimentId ?? ++experimentCounter;
  const physics = runPhysicsSimulation(cfg);
  const warnings = [...physics.warnings];

  if (!options.skipSensitivityCheck) {
    const sens = probeInputSensitivity(cfg);
    if (!sens.sensitive) warnings.push("NON-SENSITIVE MODEL DETECTED");
    warnings.push(...sens.warnings);
  }

  const result: ExperimentResult = {
    experimentId: id,
    alpha: cfg.alpha,
    speed3D: cfg.speed3D,
    warp4D: cfg.warp4D,
    superShift: cfg.superShift,
    maxW: physics.maxW,
    minW: physics.minW,
    averageW: physics.averageW,
    varianceW: physics.varianceW,
    energy: physics.energy,
    energyConservationError: physics.energyConservationError,
    timeDilation: physics.timeDilation,
    trajectoryDeviation: physics.trajectoryDeviation,
    singularityRisk: physics.singularityRisk,
    stabilityScore: physics.stabilityScore,
    entropyW: physics.entropyW,
    regime: physics.regime,
    label:
      physics.singularityRisk > 45
        ? "İnflyasiya riski"
        : physics.stabilityScore > 70
          ? "Gəlir fürsəti"
          : "Balans",
    score: physics.stabilityScore * 0.6 + physics.averageW * 10 - physics.singularityRisk * 0.3,
    warnings: options.skipWarnings ? [] : warnings,
  };

  if (!options.skipLogging && !options.slim) {
    logExperiment(id, cfg, result, warnings);
  }

  return result;
}

function logExperiment(
  id: number,
  cfg: ReturnType<typeof mergeConfig>,
  result: ExperimentResult,
  warnings: string[],
): void {
  const lines = [
    `Experiment #${id}`,
    `Parameters: alpha=${cfg.alpha}, speed3D=${cfg.speed3D}, warp4D=${cfg.warp4D}, superShift=${cfg.superShift}, steps=${cfg.simulationSteps}`,
    `Results: maxW=${result.maxW?.toFixed(4)}, minW=${result.minW?.toFixed(4)}, avgW=${result.averageW?.toFixed(4)}, varianceW=${result.varianceW?.toFixed(6)}, energy=${Number(result.energy).toFixed(4)}, stability=${Number(result.stabilityScore).toFixed(1)}`,
    warnings.length ? `Warnings: ${warnings.join("; ")}` : "Warnings: none",
  ];
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.info("[Hyperdimension]", lines.join("\n"));
  }
}

export function generateParameterGrid(
  ranges: typeof BATCH_RANGES = BATCH_RANGES,
): Array<Pick<typeof CONFIG, "alpha" | "speed3D" | "warp4D" | "superShift">> {
  const alphas = linspace(ranges.alpha);
  const speeds = linspace(ranges.speed3D);
  const warps = linspace(ranges.warp4D);
  const shifts = linspace(ranges.superShift);
  const grid: Array<Pick<typeof CONFIG, "alpha" | "speed3D" | "warp4D" | "superShift">> = [];

  for (const alpha of alphas) {
    for (const speed3D of speeds) {
      for (const warp4D of warps) {
        for (const superShift of shifts) {
          grid.push({ alpha, speed3D, warp4D, superShift });
        }
      }
    }
  }
  return grid;
}

export function runBatch(
  maxCombos?: number,
  simulationSteps = BATCH_SIMULATION_STEPS,
): ExperimentResult[] {
  const grid = generateParameterGrid();
  const slice = maxCombos ? grid.slice(0, maxCombos) : grid;
  return slice.map((params, i) =>
    runExperiment(
      { ...params, simulationSteps },
      { skipSensitivityCheck: true, skipLogging: true, skipWarnings: true, slim: true, experimentId: i + 1 },
    ),
  );
}

export { BATCH_SIMULATION_STEPS };
