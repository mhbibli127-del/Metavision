export type MetavisionBusinessData = {
  orders?: Array<{ amount: number; status: string }>;
  reservations?: Array<{ guests: number; status: string; isVip?: boolean }>;
  inventory?: Array<{ quantity: number; minQuantity: number; status: string; costPerUnit?: number }>;
  customers?: Array<{ visits: number; totalSpent: number }>;
  menu?: Array<{ price?: number; available?: boolean }>;
  revenue?: { total?: number; todayDelta?: number };
};

export type NormalizedFeatures = {
  orderAmounts: number[];
  orderStatuses: string[];
  reservationGuests: number[];
  inventoryLevels: number[];
  inventoryRiskFlags: number[];
  customerVisits: number[];
  customerSpend: number[];
  menuPrices: number[];
};

export type FeatureMetrics = {
  revenueStability: number;
  orderFulfillmentRate: number;
  inventoryRiskScore: number;
  customerRetentionIndex: number;
  reservationOccupancy: number;
  demandVolatility: number;
  operationsHealthScore: number;
  anomalyCount: number;
  avgOrderValue: number;
  totalRevenue: number;
  lowStockCount: number;
  vipReservationShare: number;
};

export type FeatureInsight = {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "revenue" | "inventory" | "customers" | "reservations" | "operations";
  message: string;
};

export type FeatureRecommendation = {
  id: string;
  priority: "low" | "medium" | "high";
  action: string;
  impact: string;
};

export type FeatureUiPayload = {
  healthScore: number;
  healthLabel: "excellent" | "good" | "fair" | "at_risk";
  scoreCards: Array<{ key: string; label: string; value: number; unit: string }>;
  alerts: Array<{ level: string; text: string }>;
  updatedAt: string;
};

export type FeatureBrainOutput = {
  status: "ok" | "error";
  module: "hyperdimension";
  metrics: FeatureMetrics;
  insights: FeatureInsight[];
  recommendations: FeatureRecommendation[];
  ui_payload: FeatureUiPayload;
  error?: string;
};

export type AnalyzeOptions = {
  skipCache?: boolean;
  enableLabMode?: boolean;
};
