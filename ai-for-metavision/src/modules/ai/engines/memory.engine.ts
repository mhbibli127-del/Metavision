import { Injectable } from '@nestjs/common';
import { RedisService } from '@/config/queue/redis.service';

/**
 * Memory Engine - Manages short-term and long-term memory
 * Stores interaction history, preferences, and learned patterns
 * Now backed by Redis for scalability
 */
@Injectable()
export class MemoryEngine {
  private shortTermMemory = new Map<string, { value: object; expiresAt: number }>();

  constructor(private redisService: RedisService) {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60000);
  }

  async storeMemory(key: string, value: object, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : Date.now() + 86400000; // Default 24h
    const entry = { value, expiresAt };

    // Store in Redis for persistence
    await this.redisService.setJson(`memory:${key}`, entry, ttl);

    // Also keep in-memory cache
    this.shortTermMemory.set(key, entry);
  }

  async retrieveMemory(key: string): Promise<object | null> {
    // Try in-memory cache first
    let entry = this.shortTermMemory.get(key);

    // If not in cache, fetch from Redis
    if (!entry) {
      const redisEntry = await this.redisService.getJson<{ value: object; expiresAt: number }>(
        `memory:${key}`,
      );
      if (redisEntry) {
        entry = redisEntry;
        this.shortTermMemory.set(key, redisEntry);
      }
    }

    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.shortTermMemory.delete(key);
      await this.redisService.delete(`memory:${key}`);
      return null;
    }

    return entry.value;
  }

  async deleteMemory(key: string): Promise<void> {
    this.shortTermMemory.delete(key);
    await this.redisService.delete(`memory:${key}`);
  }

  async getUserMemory(userId: string): Promise<object> {
    const memory = await this.retrieveMemory(`user:${userId}`);
    return memory || {};
  }

  async updateUserMemory(userId: string, data: object): Promise<void> {
    const existing = (await this.getUserMemory(userId)) || {};
    const merged = { ...existing, ...data, updatedAt: new Date() };
    await this.storeMemory(`user:${userId}`, merged, 2592000000); // 30 days
  }

  async getConversationHistory(conversationId: string): Promise<object[]> {
    const history = await this.retrieveMemory(`conversation:${conversationId}`);
    return Array.isArray(history) ? history : [];
  }

  async addToConversationHistory(
    conversationId: string,
    message: object,
  ): Promise<void> {
    const history = await this.getConversationHistory(conversationId);
    history.push({
      ...message,
      timestamp: new Date(),
    });

    // Keep last 100 messages
    const trimmedHistory = history.slice(-100);
    await this.storeMemory(`conversation:${conversationId}`, trimmedHistory, 3600000); // 1 hour
  }

  async storeUserPreference(userId: string, key: string, value: any): Promise<void> {
    const userMem = await this.getUserMemory(userId);
    const preferences = (userMem as any).preferences || {};
    preferences[key] = value;
    await this.updateUserMemory(userId, { preferences });
  }

  async getUserPreference(userId: string, key: string): Promise<any> {
    const userMem = await this.getUserMemory(userId);
    const preferences = (userMem as any).preferences || {};
    return preferences[key] || null;
  }

  async getAllUserPreferences(userId: string): Promise<object> {
    const userMem = await this.getUserMemory(userId);
    return (userMem as any).preferences || {};
  }

  async cacheAnalyticsResult(restaurantId: string, data: object): Promise<void> {
    await this.storeMemory(
      `analytics:${restaurantId}`,
      data,
      3600000, // 1 hour cache
    );
  }

  async getCachedAnalyticsResult(restaurantId: string): Promise<object | null> {
    return this.retrieveMemory(`analytics:${restaurantId}`);
  }

  async cacheRecommendations(userId: string, restaurantId: string, recommendations: object[]): Promise<void> {
    await this.storeMemory(
      `recommendations:${userId}:${restaurantId}`,
      { recommendations, cachedAt: new Date() },
      1800000, // 30 minutes cache
    );
  }

  async getCachedRecommendations(userId: string, restaurantId: string): Promise<object[] | null> {
    const cached = await this.retrieveMemory(`recommendations:${userId}:${restaurantId}`);
    return cached ? (cached as any).recommendations : null;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.shortTermMemory.entries()) {
      if (entry.expiresAt < now) {
        this.shortTermMemory.delete(key);
      }
    }
  }

  // Get memory stats for debugging
  async getMemoryStats(): Promise<object> {
    return {
      inMemoryEntries: this.shortTermMemory.size,
      entries: Array.from(this.shortTermMemory.keys()),
      redisStats: await this.redisService.getStats(),
    };
  }
}
