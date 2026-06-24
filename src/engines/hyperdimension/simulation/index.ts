/** Barrel export for Hyperdimension simulation engine (TypeScript path) */
export * from "./config";
export * from "./numerics";
export * from "./projection";
export * from "./physics";
export * from "./experiment";
export * from "./statistics";
export * from "./validation";
export {
  getAuditReport,
  runDiscovery,
  runDiscoveryCore,
  runRegimeTheoryConstruction,
  runUniversalLawDiscovery,
} from "./discovery";

import * as config from "./config";
import * as experiment from "./experiment";
import * as statistics from "./statistics";
import * as validation from "./validation";
import * as discovery from "./discovery";

export function createSimulationModules() {
  return {
    config: {
      CONFIG: config.CONFIG,
      BATCH_RANGES: config.BATCH_RANGES,
      BATCH_SIMULATION_STEPS: config.BATCH_SIMULATION_STEPS,
      mergeConfig: config.mergeConfig,
      linspace: config.linspace,
    },
    experiment: {
      runExperiment: experiment.runExperiment,
      generateParameterGrid: experiment.generateParameterGrid,
      runBatch: experiment.runBatch,
    },
    statistics: {
      mean: statistics.mean,
      variance: statistics.variance,
      stdDev: statistics.stdDev,
      correlation: statistics.correlation,
      analyzeBatch: statistics.analyzeBatch,
      generateReport: statistics.generateReport,
      toCSV: statistics.toCSV,
      toJSON: statistics.toJSON,
    },
    validation: {
      computeBatchAssessment: validation.computeBatchAssessment,
      validateSingleConfig: validation.validateSingleConfig,
    },
    discovery: {
      runDiscovery: discovery.runDiscovery,
    },
    discoveryCore: {
      runDiscoveryCore: discovery.runDiscoveryCore,
    },
    regimeTheory: {
      runRegimeTheoryConstruction: discovery.runRegimeTheoryConstruction,
    },
    universalLaw: {
      runUniversalLawDiscovery: discovery.runUniversalLawDiscovery,
    },
    audit: {
      getAuditReport: discovery.getAuditReport,
    },
  };
}
