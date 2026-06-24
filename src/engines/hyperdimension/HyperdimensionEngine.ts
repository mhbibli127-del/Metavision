import {
  applyDiscoveryToContext,
  getSharedContext,
  resetSharedContext,
  updateContextFromResults,
} from "./context";
import { loadHyperdimensionModules } from "./loader";
import { buildExecutionGraph, buildModuleRegistry } from "./registry";
import type {
  EngineOutput,
  ExperimentResult,
  HyperdimensionConfig,
} from "./types";

const BATCH_OPTS = {
  skipSensitivityCheck: true,
  skipLogging: true,
  skipWarnings: true,
  slim: true,
} as const;

export class HyperdimensionEngine {
  readonly name = "hyperdimension";
  private initialized = false;
  private registry = buildModuleRegistry();
  private graph = buildExecutionGraph(this.registry);

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await loadHyperdimensionModules();
    this.registry = buildModuleRegistry();
    this.graph = buildExecutionGraph(this.registry);
    this.initialized = true;
  }

  getRegistry() {
    return this.registry;
  }

  getExecutionGraph() {
    return this.graph;
  }

  getContext() {
    return getSharedContext();
  }

  reset() {
    resetSharedContext();
  }

  /** Single experiment or array of configs */
  async run(
    input: HyperdimensionConfig | HyperdimensionConfig[] | ExperimentResult[],
  ): Promise<EngineOutput> {
    await this.initialize();
    const mods = await loadHyperdimensionModules();

    if (Array.isArray(input) && input.length > 0 && "maxW" in input[0]) {
      const results = input as ExperimentResult[];
      updateContextFromResults(results);
      return this.wrapResults(results);
    }

    const configs = Array.isArray(input) ? input : [input];
    const results: ExperimentResult[] = configs.map((cfg) =>
      mods.experiment.runExperiment(
        { ...mods.config.CONFIG, ...cfg },
        BATCH_OPTS,
      ) as ExperimentResult,
    );

    updateContextFromResults(results);
    return this.wrapResults(results);
  }

  /** Batch parameter grid sweep */
  async train(options?: { maxCombos?: number }): Promise<EngineOutput> {
    await this.initialize();
    const mods = await loadHyperdimensionModules();
    const grid = mods.experiment.generateParameterGrid(mods.config.BATCH_RANGES);
    const max = options?.maxCombos ?? grid.length;
    const slice = grid.slice(0, max);
    const base = mods.config.mergeConfig({
      simulationSteps: mods.config.BATCH_SIMULATION_STEPS,
    });

    const results: ExperimentResult[] = [];
    for (const params of slice) {
      results.push(
        mods.experiment.runExperiment(
          { ...base, ...params },
          BATCH_OPTS,
        ) as ExperimentResult,
      );
    }

    updateContextFromResults(results);
    const analysis = mods.statistics.analyzeBatch(results, { lite: true });
    const report = mods.statistics.generateReport(results, analysis, null, { lite: true });

    return {
      ...this.baseOutput(),
      results,
      analysis,
      report,
      confidence_score: this.scoreFromReport(report),
    };
  }

  /** Discovery / inference on experiment results */
  async infer(results?: ExperimentResult[]): Promise<EngineOutput> {
    await this.initialize();
    const mods = await loadHyperdimensionModules();
    const data = results ?? getSharedContext().experiment_history;

    if (!data.length) {
      return {
        ...this.baseOutput(),
        status: "error",
        errors: ["No experiment data — run train() or run(config) first"],
        confidence_score: 0,
      };
    }

    const discoveryCore = mods.discoveryCore.runDiscoveryCore(data);
    const regimeTheory = mods.regimeTheory.runRegimeTheoryConstruction(data);
    const universal = mods.universalLaw.runUniversalLawDiscovery(data);

    applyDiscoveryToContext({
      invariants: discoveryCore.invariants ?? [],
      symmetry_groups: discoveryCore.symmetry_groups ?? [],
      regime_models: regimeTheory.regime_models ?? {},
      broken_symmetries: discoveryCore.broken_symmetries ?? [],
    });

    const universalFound = Boolean(
      discoveryCore.universal_law_found ||
        (universal.universal_law_candidate &&
          !String(universal.universal_law_candidate).startsWith("NO UNIVERSAL")),
    );

    return {
      module: "hyperdimension",
      status: "active",
      integrated_into: "Metavision",
      universal_law_found: universalFound,
      invariants: discoveryCore.invariants ?? [],
      regime_models: {
        ...(regimeTheory.regime_models ?? {}),
        transition_operator: regimeTheory.transition_operator,
      },
      symmetry_breaking: discoveryCore.broken_symmetries ?? [],
      confidence_score: Number(discoveryCore.confidence_score ?? universal.confidence_score ?? 0),
      execution_graph: this.graph,
      mode: universalFound ? "universal" : "non-universal physics",
      discovery: {
        discoveryCore,
        regimeTheory,
        universalLaw: universal,
      },
      results: data,
    };
  }

  /** Validate physics model on results */
  async validate(results?: ExperimentResult[]): Promise<EngineOutput> {
    await this.initialize();
    const mods = await loadHyperdimensionModules();
    const data = results ?? getSharedContext().experiment_history;

    if (!data.length) {
      return {
        ...this.baseOutput(),
        status: "error",
        errors: ["No data to validate"],
        confidence_score: 0,
      };
    }

    const assessment = mods.validation.computeBatchAssessment(data);
    const audit = mods.audit.getAuditReport();
    const analysis = mods.statistics.analyzeBatch(data, { lite: data.length > 200 });

    return {
      ...this.baseOutput(),
      analysis,
      report: assessment,
      discovery: audit,
      confidence_score: Number(assessment?.physics_validity_score ?? 0),
      universal_law_found: false,
      invariants: getSharedContext().invariants,
      regime_models: getSharedContext().regime_state,
      symmetry_breaking: [],
    };
  }

  /** Full pipeline: train → infer → validate → export */
  async exportReport(options?: { maxCombos?: number }): Promise<EngineOutput> {
    const trained = await this.train(options);
    const inferred = await this.infer(trained.results);
    const validated = await this.validate(trained.results);

    return {
      ...inferred,
      analysis: trained.analysis,
      report: {
        batch: trained.report,
        validation: validated.report,
        audit: validated.discovery,
      },
      results: trained.results,
      confidence_score: Math.max(
        inferred.confidence_score,
        validated.confidence_score,
      ),
    };
  }

  private baseOutput(): EngineOutput {
    return {
      module: "hyperdimension",
      status: "active",
      integrated_into: "Metavision",
      universal_law_found: false,
      invariants: getSharedContext().invariants,
      regime_models: getSharedContext().regime_state,
      symmetry_breaking: [],
      confidence_score: 0,
      execution_graph: this.graph,
      mode: "non-universal physics",
    };
  }

  private wrapResults(results: ExperimentResult[]): EngineOutput {
    return {
      ...this.baseOutput(),
      results,
      confidence_score: results.length
        ? results.reduce((s, r) => s + (Number(r.stabilityScore) || 0), 0) / results.length
        : 0,
    };
  }

  private scoreFromReport(report: Record<string, unknown> | null): number {
    if (!report) return 0;
    const physics = Number(report.physics_validity_score);
    const sensitivity = Number(report.input_sensitivity_score);
    if (Number.isFinite(physics) && Number.isFinite(sensitivity)) {
      return (physics + sensitivity) / 2;
    }
    return Number.isFinite(physics) ? physics : 0;
  }
}

let engineInstance: HyperdimensionEngine | null = null;

export function getHyperdimensionEngine(): HyperdimensionEngine {
  if (!engineInstance) {
    engineInstance = new HyperdimensionEngine();
  }
  return engineInstance;
}

export const hyperdimension = getHyperdimensionEngine();
