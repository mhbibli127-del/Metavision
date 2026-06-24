export type TrendPayload = {
  source: string;
  trends: string[];
  updatedAt: string;
  dataSource?: "live" | "cache" | "fallback";
  success?: boolean;
  stale?: boolean;
  error?: string;
  meta?: Record<string, unknown>;
};

export type UnifiedTrendsResponse = {
  updatedAt: string;
  success?: boolean;
  sources: {
    tiktok?: TrendPayload;
    google?: TrendPayload;
    news?: TrendPayload;
    x?: TrendPayload;
  };
  hashtags: string[];
  headlines: string[];
};
