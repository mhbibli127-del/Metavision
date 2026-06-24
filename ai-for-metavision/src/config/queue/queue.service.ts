import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { QueueJobName, QueueName, RETRY_POLICY } from './queue.types';

/**
 * Queue Service - Manage async jobs and queues
 * Handles: analytics, AI processing, notifications, order processing
 */
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QueueName.ANALYTICS) private analyticsQueue: Queue,
    @InjectQueue(QueueName.AI) private aiQueue: Queue,
    @InjectQueue(QueueName.MEMORY) private memoryQueue: Queue,
    @InjectQueue(QueueName.ORDERS) private ordersQueue: Queue,
    @InjectQueue(QueueName.NOTIFICATIONS) private notificationsQueue: Queue,
  ) {}

  /**
   * Analytics Jobs
   */
  async scheduleRevenueCalculation(restaurantId: string): Promise<void> {
    await this.analyticsQueue.add(
      QueueJobName.CALCULATE_RESTAURANT_REVENUE,
      { restaurantId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  async scheduleDailyStats(restaurantId: string): Promise<void> {
    await this.analyticsQueue.add(
      QueueJobName.CALCULATE_DAILY_STATS,
      { restaurantId },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  async schedulePopularItemsCalculation(restaurantId: string): Promise<void> {
    await this.analyticsQueue.add(
      QueueJobName.GENERATE_POPULAR_ITEMS,
      { restaurantId },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  /**
   * AI Engine Jobs
   */
  async scheduleBehaviorAnalysis(userId: string): Promise<void> {
    await this.aiQueue.add(
      QueueJobName.ANALYZE_USER_BEHAVIOR,
      { userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
  }

  async scheduleRecommendationGeneration(
    userId: string,
    restaurantId: string,
    limit?: number,
  ): Promise<void> {
    await this.aiQueue.add(
      QueueJobName.GENERATE_RECOMMENDATIONS,
      { userId, restaurantId, limit: limit || 5 },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
  }

  async scheduleForecastGeneration(restaurantId: string, days?: number): Promise<void> {
    await this.aiQueue.add(
      QueueJobName.GENERATE_FORECAST,
      { restaurantId, days: days || 7 },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  /**
   * Memory Engine Jobs
   */
  async scheduleMemoryCleanup(): Promise<void> {
    await this.memoryQueue.add(
      QueueJobName.CLEANUP_EXPIRED_MEMORY,
      {},
      {
        repeat: { cron: '0 * * * *' }, // Every hour
        attempts: 1,
        removeOnComplete: true,
      },
    );
  }

  async scheduleUserPreferenceSync(userId: string): Promise<void> {
    await this.memoryQueue.add(
      QueueJobName.SYNC_USER_PREFERENCES,
      { userId },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  /**
   * Order Processing Jobs
   */
  async scheduleOrderProcessing(orderId: string): Promise<void> {
    await this.ordersQueue.add(
      QueueJobName.PROCESS_ORDER,
      { orderId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
  }

  async scheduleOrderNotification(orderId: string, userId: string): Promise<void> {
    await this.notificationsQueue.add(
      QueueJobName.SEND_ORDER_NOTIFICATION,
      { orderId, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
      },
    );
  }

  /**
   * Notification Jobs
   */
  async scheduleEmail(to: string, subject: string, body: string): Promise<void> {
    await this.notificationsQueue.add(
      QueueJobName.SEND_EMAIL,
      { to, subject, body },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  async scheduleNotification(userId: string, title: string, message: string): Promise<void> {
    await this.notificationsQueue.add(
      QueueJobName.SEND_NOTIFICATION,
      { userId, title, message },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
      },
    );
  }

  /**
   * Get Queue Stats
   */
  async getQueueStats(queueName: QueueName): Promise<object> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Clear Queue
   */
  async clearQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.clean(0, 'failed');
    await queue.clean(0, 'completed');
  }

  private getQueue(queueName: QueueName): Queue {
    switch (queueName) {
      case QueueName.ANALYTICS:
        return this.analyticsQueue;
      case QueueName.AI:
        return this.aiQueue;
      case QueueName.MEMORY:
        return this.memoryQueue;
      case QueueName.ORDERS:
        return this.ordersQueue;
      case QueueName.NOTIFICATIONS:
        return this.notificationsQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}
