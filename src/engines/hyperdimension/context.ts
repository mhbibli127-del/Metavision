import type { ExperimentResult, HyperdimensionContext } from "./types";

let sharedContext: HyperdimensionContext = createContext();

export function createContext(): HyperdimensionContext {
  return {
    invariants: [],
    symmetry_groups: [],
    regime_state: {},
    experiment_history: [],
    coupling_matrix: {},
    lastRunAt: null,
  };
}

export function getSharedContext(): HyperdimensionContext {
  return sharedContext;
}

export function resetSharedContext(): HyperdimensionContext {
  sharedContext = createContext();
  return sharedContext;
}

export function updateContextFromResults(results: ExperimentResult[]): HyperdimensionContext {
  const ctx = getSharedContext();
  ctx.experiment_history = results;
  ctx.lastRunAt = new Date().toISOString();

  if (results.length > 0) {
    const avg = (key: keyof ExperimentResult) =>
      results.reduce((sum, row) => sum + (Number(row[key]) || 0), 0) / results.length;

    ctx.coupling_matrix = {
      alpha_varianceW: pearson(results, "alpha", "varianceW"),
      superShift_varianceW: pearson(results, "superShift", "varianceW"),
      warp4D_trajectoryDeviation: pearson(results, "warp4D", "trajectoryDeviation"),
      speed3D_energy: pearson(results, "speed3D", "energy"),
    };
  }

  return ctx;
}

export function applyDiscoveryToContext(discovery: {
  invariants?: unknown[];
  symmetry_groups?: unknown[];
  regime_models?: Record<string, unknown>;
  broken_symmetries?: string[];
}): HyperdimensionContext {
  const ctx = getSharedContext();
  if (discovery.invariants) ctx.invariants = discovery.invariants;
  if (discovery.symmetry_groups) ctx.symmetry_groups = discovery.symmetry_groups;
  if (discovery.regime_models) ctx.regime_state = discovery.regime_models;
  return ctx;
}

function pearson(rows: ExperimentResult[], xKey: string, yKey: string): number {
  const xs = rows.map((r) => Number(r[xKey]) || 0);
  const ys = rows.map((r) => Number(r[yKey]) || 0);
  const n = xs.length;
  if (n < 2) return 0;

  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;

  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx;
    const vy = ys[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }

  const den = Math.sqrt(dx * dy);
  return den < 1e-12 ? 0 : num / den;
}
