export type JobName = "report.daily" | "trends.refresh" | "forecast.batch" | "meta.sync";

export type JobPayload = {
  restaurantId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
};
