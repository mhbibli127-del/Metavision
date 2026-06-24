export type AiUsageRow = {
  restaurantId: string;
  restaurantName: string;
  tokens: number;
  costUsd: number;
  requests: number;
  errorRate: number;
};

export type FeatureFlag = {
  key: string;
  label: string;
  enabled: boolean;
  description: string;
};

export const MOCK_AI_USAGE: AiUsageRow[] = [
  { restaurantId: "r1", restaurantName: "Dolma House", tokens: 124000, costUsd: 18.4, requests: 342, errorRate: 0.02 },
  { restaurantId: "r2", restaurantName: "Baku Grill", tokens: 89000, costUsd: 12.1, requests: 210, errorRate: 0.05 },
  { restaurantId: "r3", restaurantName: "Caspian Bistro", tokens: 45000, costUsd: 6.8, requests: 98, errorRate: 0.01 },
];

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { key: "autopilot_pricing", label: "Autopilot Pricing", enabled: true, description: "Dynamic menu price suggestions" },
  { key: "taste_dna", label: "Taste DNA", enabled: true, description: "Flavor identity profiling" },
  { key: "command_center_v2", label: "Command Center v2", enabled: false, description: "Accept/reject AI actions UI" },
  { key: "pos_square", label: "Square POS", enabled: false, description: "Square integration beta" },
];
