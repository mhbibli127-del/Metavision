# Redis & Queue System Documentation

## Overview

Step 11 implements Redis for caching, session management, and a job queue system using Bull for async processing.

---

## Components

### 1. Redis Service (`redis.service.ts`)
**Purpose:** Manage Redis connections and operations

**Key Methods:**
- `get(key)` / `set(key, value, ttl)` - String operations
- `getJson<T>(key)` / `setJson<T>(key, value, ttl)` - JSON serialization
- `exists(key)` / `delete(key)` - Key management
- `increment(key)` / `decrement(key)` - Counter operations
- `hget(key, field)` / `hset(key, field, value)` / `hgetall(key)` - Hash operations
- `lpush(key, value)` / `rpop(key)` / `lrange(key, start, stop)` - List operations
- `publish(channel, message)` / `subscribe(channel, callback)` - Pub/Sub messaging
- `flushAll()` - Clear all data
- `getStats()` - Get Redis statistics

**Usage:**
```typescript
// String operations
await redisService.set('key', 'value', 3600000); // 1 hour TTL
const value = await redisService.get('key');

// JSON operations
await redisService.setJson('user:123', { name: 'John' }, 86400000); // 24h
const user = await redisService.getJson<User>('user:123');

// Counter operations
await redisService.increment('request_count');

// Hash operations (user preferences)
await redisService.hset('user:123:prefs', 'theme', 'dark');
const prefs = await redisService.hgetall('user:123:prefs');
```

---

### 2. Queue Service (`queue.service.ts`)
**Purpose:** Manage async job processing with Bull queues

**Queue Types:**
- **Analytics Queue** - Heavy computations (revenue, stats, trends)
- **AI Queue** - ML model operations (behavior analysis, recommendations)
- **Memory Queue** - Memory management and cleanup
- **Orders Queue** - Order processing
- **Notifications Queue** - Email and notification delivery

**Job Types:**
```typescript
enum QueueJobName {
  // Analytics
  CALCULATE_RESTAURANT_REVENUE = 'calculate_restaurant_revenue',
  CALCULATE_DAILY_STATS = 'calculate_daily_stats',
  GENERATE_POPULAR_ITEMS = 'generate_popular_items',

  // AI Engine
  ANALYZE_USER_BEHAVIOR = 'analyze_user_behavior',
  GENERATE_RECOMMENDATIONS = 'generate_recommendations',
  GENERATE_FORECAST = 'generate_forecast',

  // Memory
  CLEANUP_EXPIRED_MEMORY = 'cleanup_expired_memory',
  SYNC_USER_PREFERENCES = 'sync_user_preferences',

  // Orders
  PROCESS_ORDER = 'process_order',
  SEND_ORDER_NOTIFICATION = 'send_order_notification',

  // Notifications
  SEND_EMAIL = 'send_email',
  SEND_NOTIFICATION = 'send_notification',
}
```

**Key Methods:**
```typescript
// Analytics
await queueService.scheduleRevenueCalculation(restaurantId);
await queueService.scheduleDailyStats(restaurantId);
await queueService.schedulePopularItemsCalculation(restaurantId);

// AI
await queueService.scheduleBehaviorAnalysis(userId);
await queueService.scheduleRecommendationGeneration(userId, restaurantId, limit);
await queueService.scheduleForecastGeneration(restaurantId, days);

// Memory
await queueService.scheduleMemoryCleanup(); // Cron job
await queueService.scheduleUserPreferenceSync(userId);

// Orders
await queueService.scheduleOrderProcessing(orderId);
await queueService.scheduleOrderNotification(orderId, userId);

// Notifications
await queueService.scheduleEmail(to, subject, body);
await queueService.scheduleNotification(userId, title, message);

// Monitoring
const stats = await queueService.getQueueStats(QueueName.ANALYTICS);
await queueService.clearQueue(QueueName.ANALYTICS);
```

---

### 3. Memory Engine Enhancement
**Now Redis-backed** for production scalability

**Features:**
- `storeMemory()` - Persist to Redis with TTL
- `retrieveMemory()` - Get from cache/Redis
- `getUserMemory()` - User-specific storage
- `getConversationHistory()` - Chat history
- `storeUserPreference()` - User preferences
- `cacheAnalyticsResult()` - Cache analytics data
- `getCachedRecommendations()` - Fast recommendation lookup
- `getMemoryStats()` - Debugging information

---

## Configuration

### Environment Variables
```env
# Redis
REDIS_URL=redis://localhost:6379

# Or with authentication
REDIS_URL=redis://username:password@localhost:6379/0
```

### Connection Options
- **Retry Strategy:** Exponential backoff up to 2 seconds
- **Reconnection:** Auto-reconnect on connection loss
- **Pub/Sub:** Separate client for subscriptions

---

## Queue Configuration

### Retry Policies
```typescript
// Aggressive (5 attempts, exponential backoff)
{ attempts: 5, backoff: { type: 'exponential', delay: 2000 } }

// Moderate (3 attempts)
{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }

// Lazy (1 attempt)
{ attempts: 1, backoff: { type: 'fixed', delay: 10000 } }
```

### Scheduled Jobs
```typescript
// Memory cleanup every hour
repeat: { cron: '0 * * * *' }

// Custom intervals
repeat: { every: 60000 } // Every 60 seconds
```

---

## Usage Examples

### 1. Cache User Preferences
```typescript
constructor(
  private redisService: RedisService,
  private memoryEngine: MemoryEngine,
) {}

async cacheUserPreferences(userId: string) {
  const preferences = { theme: 'dark', language: 'en' };
  await this.redisService.setJson(`user:${userId}:prefs`, preferences, 2592000000); // 30 days
}

async getUserPreferences(userId: string) {
  return await this.redisService.getJson(`user:${userId}:prefs`);
}
```

### 2. Queue Order Processing
```typescript
async processOrderAsync(orderId: string) {
  // Schedule async processing
  await this.queueService.scheduleOrderProcessing(orderId);
  
  // Return immediately to user
  return { status: 'queued', orderId };
}
```

### 3. Cache Recommendations
```typescript
async getRecommendationsWithCache(userId: string, restaurantId: string) {
  // Check cache first
  const cached = await this.memoryEngine.getCachedRecommendations(userId, restaurantId);
  if (cached) return cached;

  // Generate recommendations
  const recommendations = await this.decisionEngine.generateRecommendations(userId, restaurantId);
  
  // Cache for 30 minutes
  await this.memoryEngine.cacheRecommendations(userId, restaurantId, recommendations);
  
  return recommendations;
}
```

### 4. Pub/Sub Messaging
```typescript
// Publish order status update
await this.redisService.publish('orders', JSON.stringify({
  orderId: '123',
  status: 'completed',
  timestamp: new Date(),
}));

// Subscribe to updates
await this.redisService.subscribe('orders', (message) => {
  const order = JSON.parse(message);
  console.log(`Order ${order.orderId} ${order.status}`);
});
```

---

## Performance Benefits

| Operation | In-Memory | Redis | Benefit |
|-----------|-----------|-------|------|
| User Cache | 5KB × 100K = 500MB | 100MB | 5x memory savings |
| Conversation History | Volatile | Persistent | Survives restarts |
| Distributed Access | Single instance | Multiple instances | Horizontal scaling |
| Job Queue | Not applicable | Scalable | 10K+ jobs/sec |

---

## Monitoring

### Queue Health
```bash
# Get analytics queue stats
curl http://localhost:3000/api/admin/queue/analytics

# Response:
{
  "queue": "analytics",
  "waiting": 5,
  "active": 2,
  "completed": 1250,
  "failed": 3,
  "delayed": 0,
  "total": 1260
}
```

### Redis Memory Usage
```typescript
const stats = await redisService.getStats();
// Returns info: connections, memory, keys, etc.
```

---

## Setup Instructions

### 1. Install Redis Locally

**Windows:**
```powershell
# Using WSL
wsl
sudo apt-get install redis-server
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:latest
```

**macOS:**
```bash
brew install redis
redis-server
```

**Docker (Recommended):**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:latest redis-server --appendonly yes
```

### 2. Update Environment
```bash
# .env
REDIS_URL=redis://localhost:6379
```

### 3. Install Dependencies
```bash
npm install
npm run build
```

### 4. Start Application
```bash
npm run start:dev
```

---

## Database Schema

Redis uses key-value pairs with structured naming:

```
# User Data
user:{userId}                     -> User object (24h TTL)
user:{userId}:prefs             -> User preferences (30d TTL)

# Conversations
conversation:{conversationId}    -> Message history (1h TTL)

# Memory/Cache
memory:{key}                     -> Generic memory cache
analytics:{restaurantId}         -> Analytics cache (1h TTL)
recommendations:{userId}:{rid}   -> Recommendations (30m TTL)

# Counters
request_count                    -> API request counter
```

---

## Error Handling

### Redis Connection Failure
- Automatic reconnection with exponential backoff
- Logged to console
- Application continues with degraded functionality

### Queue Job Failure
- Automatic retry based on retry policy
- Failed jobs moved to failed queue
- Can be retried manually or cleared

### Memory Overflow
- Old entries auto-cleaned every minute
- TTL enforced strictly
- Monitor with `getMemoryStats()`

---

## Next Steps (Step 12)

Docker configuration will wrap this Redis + NestJS setup into containers for production deployment.

---

## Troubleshooting

### Redis Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis server
```bash
redis-server
# or
docker run -p 6379:6379 redis:latest
```

### Queue Not Processing
**Check:**
1. Redis is running
2. Queue module imported in AppModule
3. Job processor registered
4. Check queue stats for stuck jobs

### Memory Usage Growing
**Solution:**
1. Verify TTL is set on storeMemory calls
2. Run cleanup: `await memoryEngine.cleanupExpiredEntries()`
3. Monitor with Redis: `redis-cli KEYS *`

---

## Performance Tuning

### Redis Configuration
```
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

### Connection Pooling
- Built-in via ioredis
- Auto-reconnect
- No need for manual management

### Queue Optimization
- Use `removeOnComplete: true` to clean up jobs
- Set appropriate retry policies
- Monitor failed queues regularly
