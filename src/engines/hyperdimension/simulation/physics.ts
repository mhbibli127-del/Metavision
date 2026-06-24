/**
 * Physics core — W-field evolution, energy conservation, damping.
 * Visual projection is separate (projection.ts).
 */
import { mergeConfig, type CONFIG } from "./config";
import {
  clamp,
  isFiniteNumber,
  lorentzGamma,
  safeDiv,
  saturateTanh,
  shannonEntropy,
} from "./numerics";
import {
  neighborIndices,
  project4DTo3D,
  tesseractVertices,
  trajectoryDeviation3D,
  type Vec3,
  type Vec4,
} from "./projection";

export type VertexState = Vec4 & { wField: number; wVelocity: number };

export type SimulationSnapshot = {
  step: number;
  totalEnergy: number;
  wValues: number[];
  centroid3D: Vec3;
};

export type PhysicsResult = {
  maxW: number;
  minW: number;
  averageW: number;
  varianceW: number;
  energy: number;
  energyConservationError: number;
  timeDilation: number;
  trajectoryDeviation: number;
  singularityRisk: number;
  stabilityScore: number;
  entropyW: number;
  regime: "stable" | "transitional" | "critical" | "chaotic";
  wHistory: number[];
  warnings: string[];
};

function vertexEnergy(
  cfg: typeof CONFIG,
  v: VertexState,
  laplacianW: number,
): { kinetic: number; warp: number; wEnergy: number } {
  const kinetic = 0.5 * cfg.speed3D * cfg.speed3D * (1 + Math.abs(v.x + v.y + v.z) * 0.1);
  const warp = 0.5 * cfg.warp4D * cfg.warp4D * (1 + Math.abs(laplacianW));
  const wEnergy = 0.5 * cfg.alpha * v.wField * v.wField;
  return { kinetic, warp, wEnergy };
}

function superShiftForce(cfg: typeof CONFIG, v: VertexState): number {
  if (cfg.superShift === 0) return 0;
  return (
    cfg.superShift *
    Math.sin(v.x * 1.7 + v.y * 0.9 + v.z * 1.3) *
    Math.cos(v.wField * 0.5 + cfg.superShift * 0.3)
  );
}

function crossCoupling(cfg: typeof CONFIG): number {
  return cfg.couplingScale * cfg.alpha * cfg.speed3D * cfg.warp4D;
}

export function runPhysicsSimulation(rawCfg: Partial<typeof CONFIG>): PhysicsResult {
  const cfg = mergeConfig(rawCfg);
  const warnings: string[] = [];
  const verts = tesseractVertices();
  const states: VertexState[] = verts.map((v) => ({
    ...v,
    wField: cfg.superShift * 0.05 * Math.sin(v.x + v.y),
    wVelocity: 0,
  }));

  const wTrace: number[] = [];
  const trajHistory: Vec3[] = [];
  let energyPrev = 0;
  let energyDriftSum = 0;
  let timeDilationSum = 0;
  let maxDw = 0;

  const allZeroInput =
    cfg.alpha === 0 && cfg.speed3D === 0 && cfg.warp4D === 0 && cfg.superShift === 0;

  for (let step = 0; step < cfg.simulationSteps; step++) {
    let totalEnergy = 0;
    const nextW: number[] = [];
    const nextVel: number[] = [];

    for (let i = 0; i < states.length; i++) {
      const s = states[i]!;
      const neighbors = neighborIndices(i);
      const laplacianW =
        neighbors.reduce((sum, j) => sum + states[j]!.wField, 0) / neighbors.length - s.wField;

      const { kinetic, warp, wEnergy } = vertexEnergy(cfg, s, laplacianW);
      const eVertex = kinetic + warp + wEnergy;
      totalEnergy += eVertex;

      const energyDensity = safeDiv(eVertex, states.length, 0);
      const shiftF = superShiftForce(cfg, s);
      const coupling = crossCoupling(cfg) * s.wField;

      const nonlinearFeedback = cfg.alpha > 0 ? 0.08 * s.wField * s.wField * Math.sign(s.wField) : 0;

      let dW =
        cfg.alpha * energyDensity +
        cfg.betaLaplacian * laplacianW +
        cfg.gammaSuperShift * shiftF +
        coupling +
        nonlinearFeedback -
        cfg.damping * s.wField;

      if (allZeroInput) {
        dW = -cfg.damping * s.wField;
      }

      const wVel = (s.wVelocity + dW) * (1 - cfg.friction);
      const wNew = saturateTanh(s.wField + wVel, cfg.wMax);

      maxDw = Math.max(maxDw, Math.abs(wNew - s.wField));
      nextW.push(wNew);
      nextVel.push(wVel);
    }

    for (let i = 0; i < states.length; i++) {
      states[i]!.wField = clamp(nextW[i]!, -cfg.wMax, cfg.wMax);
      states[i]!.wVelocity = nextVel[i]!;
    }

    if (step > 0) {
      energyDriftSum += Math.abs(totalEnergy - energyPrev) / Math.max(Math.abs(energyPrev), 1e-9);
    }
    energyPrev = totalEnergy;

    const vMag = Math.hypot(cfg.speed3D, cfg.warp4D);
    timeDilationSum += safeDiv(1, lorentzGamma(vMag, cfg.c), 1);

    if (step % Math.max(1, Math.floor(cfg.simulationSteps / 50)) === 0) {
      const avgW = states.reduce((s, x) => s + x.wField, 0) / states.length;
      wTrace.push(avgW);
      const centroid = states.reduce(
        (acc, st) => {
          const p = project4DTo3D(st, cfg.distance4D, cfg.distance3D);
          acc.x += p.x;
          acc.y += p.y;
          acc.z += p.z;
          return acc;
        },
        { x: 0, y: 0, z: 0 },
      );
      centroid.x /= states.length;
      centroid.y /= states.length;
      centroid.z /= states.length;
      trajHistory.push(centroid);
    }
  }

  const wValues = states.map((s) => s.wField);
  const maxW = Math.max(...wValues);
  const minW = Math.min(...wValues);
  const averageW = wValues.reduce((a, b) => a + b, 0) / wValues.length;
  const varianceW =
    wValues.reduce((s, w) => s + (w - averageW) ** 2, 0) / Math.max(1, wValues.length - 1);

  const energy = energyPrev;
  const energyConservationError =
    safeDiv(energyDriftSum, Math.max(1, cfg.simulationSteps - 1), 0) * 100;
  const timeDilation = timeDilationSum / cfg.simulationSteps;
  const trajectoryDeviation = trajectoryDeviation3D(trajHistory);

  const wSpan = maxW - minW;
  const curvatureProxy = safeDiv(varianceW, wSpan + 1e-6, 0);
  const singularityRisk = clamp(
    35 * maxDw + 25 * curvatureProxy + 20 * safeDiv(energy, cfg.energyMax, 0) + 20 * (varianceW / (cfg.wMax * cfg.wMax)),
    0,
    100,
  );

  const stabilityScore = clamp(
    100 -
      energyConservationError * 2 -
      singularityRisk * 0.4 -
      Math.max(0, varianceW - cfg.wMax * 0.5) * 15,
    0,
    100,
  );

  const bins = Array.from({ length: 8 }, () => 0);
  for (const w of wValues) {
    const b = clamp(Math.floor(((w + cfg.wMax) / (2 * cfg.wMax)) * 7.999), 0, 7);
    bins[b]!++;
  }
  const entropyW = shannonEntropy(bins);

  let regime: PhysicsResult["regime"] = "stable";
  if (varianceW > cfg.wMax * 0.35 || singularityRisk > 55) regime = "chaotic";
  else if (varianceW > cfg.wMax * 0.18 || singularityRisk > 35) regime = "critical";
  else if (varianceW > cfg.wMax * 0.08 || singularityRisk > 20) regime = "transitional";

  if (allZeroInput && maxDw > 1e-4 && cfg.damping < 0.05) {
    warnings.push("UNCONTROLLED BASE ENERGY DETECTED — non-zero motion with zero inputs");
  }

  warnings.push(...assertW(wValues));

  return {
    maxW,
    minW,
    averageW,
    varianceW,
    energy,
    energyConservationError,
    timeDilation,
    trajectoryDeviation,
    singularityRisk,
    stabilityScore,
    entropyW,
    regime,
    wHistory: wTrace,
    warnings,
  };
}

function assertW(wValues: number[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < wValues.length; i++) {
    if (!isFiniteNumber(wValues[i])) out.push(`W[${i}] non-finite`);
  }
  return out;
}

/** Quick sensitivity probe — outputs must change when inputs change */
export function probeInputSensitivity(cfg: Partial<typeof CONFIG>): {
  sensitive: boolean;
  warnings: string[];
} {
  const base = runPhysicsSimulation(cfg);
  const warnings: string[] = [];
  const keys: (keyof typeof CONFIG)[] = ["alpha", "speed3D", "warp4D", "superShift"];
  let sensitiveCount = 0;

  for (const key of keys) {
    const v = Number(cfg[key] ?? mergeConfig(cfg)[key]);
    const bump = v === 0 ? 0.01 : v * 0.05;
    const perturbed = { ...cfg, [key]: v + bump };
    const next = runPhysicsSimulation({ ...perturbed, simulationSteps: Math.min(400, mergeConfig(cfg).simulationSteps) });
    const delta = Math.abs(next.averageW - base.averageW) + Math.abs(next.varianceW - base.varianceW);
    if (delta < 1e-6) {
      warnings.push(`NON-SENSITIVE MODEL DETECTED: ${key} perturbation did not change W statistics`);
    } else {
      sensitiveCount++;
    }
  }

  return { sensitive: sensitiveCount >= 2, warnings };
}
