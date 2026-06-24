export type HyperdimensionConfig = {
  alpha: number;
  speed3D: number;
  warp4D: number;
  superShift: number;
  distance4D?: number;
  distance3D?: number;
  simulationSteps?: number;
};

export type ExperimentResult = Record<string, unknown> & {
  alpha: number;
  speed3D: number;
  warp4D: number;
  superShift: number;
  maxW: number;
  minW: number;
  averageW: number;
  varianceW: number;
  energy: number;
  stabilityScore: number;
  warnings?: string[];
  experimentId?: number | null;
};

export type ModuleType = "pipeline" | "model" | "analyzer" | "utils" | "worker";

export type ModuleDescriptor = {
  name: string;
  path: string;
  type: ModuleType;
  dependencies: string[];
  inputSchema: string[];
  outputSchema: string[];
};

export type ExecutionGraph = {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
};

export type HyperdimensionContext = {
  invariants: unknown[];
  symmetry_groups: unknown[];
  regime_state: Record<string, unknown>;
  experiment_history: ExperimentResult[];
  coupling_matrix: Record<string, number>;
  lastRunAt: string | null;
};

export type EngineOutput = {
  module: "hyperdimension";
  status: "active" | "error";
  integrated_into: "Metavision";
  universal_law_found: boolean;
  invariants: unknown[];
  regime_models: Record<string, unknown>;
  symmetry_breaking: string[];
  confidence_score: number;
  execution_graph: ExecutionGraph;
  mode?: "universal" | "non-universal physics";
  results?: ExperimentResult[];
  analysis?: unknown;
  report?: unknown;
  discovery?: unknown;
  errors?: string[];
};
