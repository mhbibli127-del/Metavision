/**
 * AI Module Constants
 */

export const AI_CONSTANTS = {
  TIME_OF_DAY: {
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    EVENING: 'evening',
    NIGHT: 'night',
  } as const,

  SEASON: {
    SPRING: 'spring',
    SUMMER: 'summer',
    FALL: 'fall',
    WINTER: 'winter',
  } as const,

  SPENDING_TREND: {
    INCREASING: 'increasing',
    DECREASING: 'decreasing',
    STABLE: 'stable',
    INSUFFICIENT_DATA: 'insufficient_data',
  } as const,

  CHURN_RISK: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  } as const,

  DATA_TYPE: {
    REVENUE: 'revenue',
    MENU: 'menu',
    ORDERS: 'orders',
    TRENDS: 'trends',
  } as const,

  TIME_RANGE: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  } as const,

  // Memory TTLs (milliseconds)
  MEMORY_TTL: {
    SHORT_TERM: 3600000, // 1 hour
    USER_MEMORY: 2592000000, // 30 days
    CONVERSATION: 3600000, // 1 hour
    PREFERENCE: 7776000000, // 90 days
  } as const,

  // Thresholds
  THRESHOLDS: {
    SPENDING_TREND_CHANGE: 0.2, // 20% change threshold
    CHURN_RISK_DAYS_MEDIUM: 30,
    CHURN_RISK_DAYS_HIGH: 90,
    RECOMMENDATION_LIMIT_MAX: 50,
    FORECAST_DAYS_MAX: 90,
  } as const,

  // Hour ranges for time of day
  HOUR_RANGES: {
    MORNING: { start: 5, end: 12 },
    AFTERNOON: { start: 12, end: 17 },
    EVENING: { start: 17, end: 21 },
    NIGHT: { start: 21, end: 5 },
  } as const,

  // Month ranges for seasons
  MONTH_RANGES: {
    SPRING: { start: 2, end: 4 }, // Mar-May (0-indexed)
    SUMMER: { start: 5, end: 7 }, // Jun-Aug
    FALL: { start: 8, end: 10 }, // Sep-Oct
    WINTER: { start: 11, end: 1 }, // Nov-Feb
  } as const,
} as const;

export type TimeOfDay = typeof AI_CONSTANTS.TIME_OF_DAY[keyof typeof AI_CONSTANTS.TIME_OF_DAY];
export type Season = typeof AI_CONSTANTS.SEASON[keyof typeof AI_CONSTANTS.SEASON];
export type SpendingTrend = typeof AI_CONSTANTS.SPENDING_TREND[keyof typeof AI_CONSTANTS.SPENDING_TREND];
export type ChurnRisk = typeof AI_CONSTANTS.CHURN_RISK[keyof typeof AI_CONSTANTS.CHURN_RISK];
export type DataType = typeof AI_CONSTANTS.DATA_TYPE[keyof typeof AI_CONSTANTS.DATA_TYPE];
export type TimeRange = typeof AI_CONSTANTS.TIME_RANGE[keyof typeof AI_CONSTANTS.TIME_RANGE];
