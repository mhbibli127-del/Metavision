import type { HyperdimensionConfig } from "../types";

/** Default simulation parameters — all physics reads from merged config */
export const CONFIG: Required<HyperdimensionConfig> & {
  damping: number;
  friction: number;
  wMax: number;
  energyMax: number;
  c: number;
  betaLaplacian: number;
  gammaSuperShift: number;
  couplingScale: number;
  instabilityEpsilon: number;
} = {
  alpha: 0.01,
  speed3D: 0.01,
  warp4D: 0.02,
  superShift: 0,
  distance4D: 2,
  distance3D: 2.3,
  simulationSteps: 5000,
  damping: 0.02,
  friction: 0.01,
  wMax: 3,
  energyMax: 100,
  c: 0.99,
  betaLaplacian: 0.15,
  gammaSuperShift: 0.25,
  couplingScale: 0.12,
  instabilityEpsilon: 0.003,
};

export type BatchRange = { min: number; max: number; steps: number };

export const BATCH_RANGES: Record<"alpha" | "speed3D" | "warp4D" | "superShift", BatchRange> = {
  alpha: { min: 0, max: 0.1, steps: 11 },
  speed3D: { min: 0, max: 0.08, steps: 9 },
  warp4D: { min: 0, max: 0.08, steps: 9 },
  superShift: { min: 0, max: 2, steps: 11 },
};

export const BATCH_SIMULATION_STEPS = 800;

export function mergeConfig(overrides: Partial<typeof CONFIG> = {}): typeof CONFIG {
  return { ...CONFIG, ...overrides };
}

export function linspace(range: BatchRange): number[] {
  if (range.steps <= 1) return [range.min];
  const out: number[] = [];
  for (let i = 0; i < range.steps; i++) {
    out.push(range.min + (i / (range.steps - 1)) * (range.max - range.min));
  }
  return out;
}
