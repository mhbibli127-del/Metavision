/** TasteMind type definitions — data comes from /api/intelligence/tastemind */

export type TasteDnaScore = {
  key: string;
  label: string;
  value: number;
  trend: "up" | "down" | "stable";
};

export type GlobalTrend = {
  region: string;
  city: string;
  cuisine: string;
  momentum: number;
  demandChange: number;
  confidence: number;
  observedAt?: string;
};

export type PredictionCard = {
  id: string;
  message: string;
  confidence: number;
  horizon: string;
  direction: "up" | "down";
  impact: "low" | "medium" | "high";
  linkedTrendCity: string;
};

export type ContextSignal = {
  key: string;
  label: string;
  value: number;
  unit: string;
  influence: "low" | "medium" | "high";
};

export type InsightEvent = {
  id: string;
  timestamp: string;
  text: string;
  severity: "info" | "alert" | "success";
  linkedModule: string;
};

export type LiveFeedItem = {
  id: string;
  timestamp: string;
  time: string;
  category: string;
  title: string;
  detail: string;
  severity: "info" | "alert" | "success";
};

export type OpsSnapshot = {
  restaurantName: string;
  city: string;
  currency: string;
  revenue: number;
  todayDelta: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrderCount: number;
  lowStockCount: number;
  activeReservations: number;
  tablesTotal: number;
  tablesOccupied: number;
  tablesReserved: number;
  competitorCount: number;
  topDishes: { name: string; qty: number; revenue: number }[];
  updatedAt: string;
};

export type RestaurantSimulationInput = {
  concept: string;
  location: string;
  priceRange: "budget" | "mid" | "premium";
  menuFocus: string;
};

export const apiEndpoints = [
  { method: "GET", path: "/api/intelligence/tastemind", purpose: "Canlı əməliyyat və bazar siqnalları" },
  { method: "GET", path: "/api/market/trends", purpose: "Bazar trendləri (DB)" },
  { method: "GET", path: "/api/market/competitors", purpose: "Rəqib monitorinqi" },
  { method: "POST", path: "/api/features/hyperdimension/analyze", purpose: "Əməliyyat sağlamlığı və tövsiyələr" },
];
