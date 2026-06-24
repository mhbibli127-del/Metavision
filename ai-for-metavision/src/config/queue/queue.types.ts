/**
 * Queue Job Names - Define all async job types
 */
export enum QueueJobName {
  // Analytics Jobs
  CALCULATE_RESTAURANT_REVENUE = 'calculate_restaurant_revenue',
  CALCULATE_DAILY_STATS = 'calculate_daily_stats',
  GENERATE_POPULAR_ITEMS = 'generate_popular_items',

  // AI Engine Jobs
  ANALYZE_USER_BEHAVIOR = 'analyze_user_behavior',
  GENERATE_RECOMMENDATIONS = 'generate_recommendations',
  GENERATE_FORECAST = 'generate_forecast',

  // Memory Engine Jobs
  CLEANUP_EXPIRED_MEMORY = 'cleanup_expired_memory',
  SYNC_USER_PREFERENCES = 'sync_user_preferences',

  // Order Processing
  PROCESS_ORDER = 'process_order',
  SEND_ORDER_NOTIFICATION = 'send_order_notification',

  // Email/Notifications
  SEND_EMAIL = 'send_email',
  SEND_NOTIFICATION = 'send_notification',

  // Phase 1: Data Ingestion
  INGEST_TRENDS = 'ingest_trends',
  PROCESS_SIGNALS = 'process_signals',
  UPDATE_TASTE_DNA = 'update_taste_dna',
  DETECT_INCIDENTS = 'detect_incidents',
}

/**
 * Queue Names - Group related jobs
 */
export enum QueueName {
  ANALYTICS = 'analytics',
  AI = 'ai',
  MEMORY = 'memory',
  ORDERS = 'orders',
  NOTIFICATIONS = 'notifications',
  INGESTION = 'ingestion',
}

/**
 * Job Status
 */
export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

/**
 * Retry Policy
 */
export const RETRY_POLICY = {
  AGGRESSIVE: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
  MODERATE: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  LAZY: { attempts: 1, backoff: { type: 'fixed', delay: 10000 } },
} as const;
