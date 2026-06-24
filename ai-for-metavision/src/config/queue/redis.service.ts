import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConnection } from '@/config/redis.config';

function createRedisClient(): Redis {
  const connection = getRedisConnection();
  if (typeof connection === 'string') {
    return new Redis(connection, { maxRetriesPerRequest: null });
  }
  return new Redis(connection);
}

/**
 * Redis Service — Upstash TLS, cache, pub/sub, queue storage
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private pubSubClient: Redis;

  constructor() {
    this.client = createRedisClient();
    this.pubSubClient = createRedisClient();

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✓ Redis connected');
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string | object, ttl?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.client.setex(key, Math.floor(ttl / 1000), stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decrement(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async lpush(key: string, value: string | object): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.lpush(key, stringValue);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async publish(channel: string, message: string | object): Promise<void> {
    const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
    await this.client.publish(channel, stringMessage);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.pubSubClient.subscribe(channel);
    this.pubSubClient.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async flushAll(): Promise<void> {
    await this.client.flushall();
  }

  async getStats(): Promise<object> {
    const info = await this.client.info('stats');
    return { info };
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    await this.pubSubClient.quit();
  }
}
