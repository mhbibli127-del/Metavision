import { getFeatureBrainEngine } from "./hyperdimension";

/** Metavision production feature intelligence layer */
export const MetavisionFeatures = {
  hyperdimension: getFeatureBrainEngine(),
};

export const features = MetavisionFeatures;

export {
  FeatureBrainEngine,
  getFeatureBrainEngine,
  hyperdimensionFeatures,
  collectDashboardData,
} from "./hyperdimension";

export type {
  FeatureBrainOutput,
  FeatureMetrics,
  FeatureInsight,
  FeatureRecommendation,
  FeatureUiPayload,
  MetavisionBusinessData,
} from "./hyperdimension";
