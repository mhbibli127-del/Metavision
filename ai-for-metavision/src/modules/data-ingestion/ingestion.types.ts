// Types for Phase 1 real-time ingestion pipeline

export interface WeatherSignal {
  city: string;
  condition: string; // rain | sunny | cloudy | snow
  temperatureCelsius: number;
  humidityPercent: number;
  fetchedAt: Date;
}

export interface TrendSignal {
  city: string;
  region: string;
  cuisine: string;
  momentum: number;      // 0–100
  demandChange: number;  // % change (can be negative)
  confidence: number;    // 0–100
  source: string;
}

export interface ContextSignalRaw {
  key: string;
  label: string;
  value: number;
  unit: string;
  influence: 'low' | 'medium' | 'high';
  source: string;
}

export interface TasteDnaUpdate {
  userId: string;
  scores: Record<string, number>;
}

export interface IncidentDetected {
  restaurantId?: string;
  incident: string;
  effect: string;
  effectPercent: number;
  recommendation: string;
}
