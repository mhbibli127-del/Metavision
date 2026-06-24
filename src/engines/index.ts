import { getHyperdimensionEngine } from "./hyperdimension";
import { MetavisionFeatures } from "@/features";

/** Production feature intelligence (dashboard / UI) */
export const features = MetavisionFeatures;

/** Research / lab simulation engine (heavy computation, opt-in) */
export const MetavisionBrain = {
  async run(input: unknown) {
    const engine = getHyperdimensionEngine();
    return engine.run(input as Parameters<typeof engine.run>[0]);
  },

  async train(options?: { maxCombos?: number }) {
    return getHyperdimensionEngine().train(options);
  },

  async infer(results?: unknown[]) {
    return getHyperdimensionEngine().infer(results as never);
  },

  async validate(results?: unknown[]) {
    return getHyperdimensionEngine().validate(results as never);
  },

  async exportReport(options?: { maxCombos?: number }) {
    return getHyperdimensionEngine().exportReport(options);
  },
};

export const engines = {
  hyperdimension: getHyperdimensionEngine(),
};

export { MetavisionFeatures } from "@/features";
