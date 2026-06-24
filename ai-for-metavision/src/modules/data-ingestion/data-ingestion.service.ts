import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/queue/redis.service';
import { WeatherService } from './weather.service';
import { TrendsService } from './trends.service';
import { ExternalSignalsService } from './external-signals.service';
import { TrendSignal, ContextSignalRaw, IncidentDetected } from './ingestion.types';

const cacheTtlMs = () => {
  const sec = Number(process.env.AI_CACHE_TTL ?? 1800);
  return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 1_800_000;
};

const liveChannel = () => process.env.STREAM_CHANNEL || 'tastemind:live';

@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly weather: WeatherService,
    private readonly trends: TrendsService,
    private readonly signals: ExternalSignalsService,
  ) {}

  /** Full ingestion cycle — called by Bull job INGEST_TRENDS */
  async ingestTrends(): Promise<void> {
    this.logger.log('Ingesting trend signals...');
    const raw = await this.trends.fetchAll();

    for (const trend of raw) {
      await this.prisma.globalTrendRecord.create({
        data: {
          city: trend.city,
          region: trend.region,
          cuisine: trend.cuisine,
          momentum: trend.momentum,
          demandChange: trend.demandChange,
          confidence: trend.confidence,
          source: trend.source,
        },
      });
    }

    await this.redis.setJson('tastemind:global_trends', raw, cacheTtlMs());
    await this.redis.publish('tastemind:trends', JSON.stringify(raw));
    await this.redis.publish(liveChannel(), JSON.stringify({ type: 'trends', data: raw }));
    this.logger.log(`Ingested ${raw.length} trend records`);
  }

  /** Process context signals — called by Bull job PROCESS_SIGNALS */
  async processSignals(): Promise<void> {
    this.logger.log('Processing context signals...');
    const weatherData = await this.weather.fetchAll();
    const contextSignals = this.signals.buildContextSignals(weatherData);

    for (const signal of contextSignals) {
      await this.prisma.contextSignalRecord.create({ data: signal });
    }

    await this.redis.setJson('tastemind:context_signals', contextSignals, cacheTtlMs());
    await this.redis.publish('tastemind:signals', JSON.stringify(contextSignals));
    await this.redis.publish(liveChannel(), JSON.stringify({ type: 'signals', data: contextSignals }));

    // Detect incidents from signals
    const incidents = this.detectIncidents(contextSignals, weatherData);
    for (const incident of incidents) {
      await this.prisma.incidentRecord.create({ data: incident });
      await this.redis.publish('tastemind:incidents', JSON.stringify(incident));
      await this.redis.publish(liveChannel(), JSON.stringify({ type: 'incident', data: incident }));
    }
  }

  /** Update Taste DNA for userId — called by Bull job UPDATE_TASTE_DNA */
  async updateTasteDna(userId: string): Promise<void> {
    const scores: Record<string, number> = {
      spicy: 70 + Math.round(Math.random() * 25),
      sweetSavory: 50 + Math.round(Math.random() * 30),
      texture: 60 + Math.round(Math.random() * 30),
      price: 40 + Math.round(Math.random() * 40),
      novelty: 65 + Math.round(Math.random() * 30),
      health: 50 + Math.round(Math.random() * 35),
    };

    const values = Object.values(scores);
    const dnaIndex = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    await this.prisma.tasteDnaSnapshot.create({ data: { userId, scores, dnaIndex } });
    await this.redis.setJson(`tastemind:dna:${userId}`, { scores, dnaIndex }, cacheTtlMs());
    await this.redis.publish('tastemind:dna', JSON.stringify({ userId, scores, dnaIndex }));
  }

  /** Read latest trends from cache (or DB fallback) */
  async getLatestTrends(): Promise<TrendSignal[]> {
    const cached = await this.redis.getJson<TrendSignal[]>('tastemind:global_trends');
    if (cached) return cached;

    const records = await this.prisma.globalTrendRecord.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 20,
      distinct: ['city'],
    });

    return records.map((r) => ({
      city: r.city,
      region: r.region,
      cuisine: r.cuisine,
      momentum: r.momentum,
      demandChange: r.demandChange,
      confidence: r.confidence,
      source: r.source,
    }));
  }

  /** Read latest context signals from cache (or DB fallback) */
  async getLatestContextSignals(): Promise<ContextSignalRaw[]> {
    const cached = await this.redis.getJson<ContextSignalRaw[]>('tastemind:context_signals');
    if (cached) return cached;

    const records = await this.prisma.contextSignalRecord.findMany({
      orderBy: { capturedAt: 'desc' },
      take: 10,
      distinct: ['key'],
    });

    return records.map((r) => ({
      key: r.key,
      label: r.label,
      value: r.value,
      unit: r.unit,
      influence: r.influence as 'low' | 'medium' | 'high',
      source: r.source,
    }));
  }

  private detectIncidents(
    signals: ContextSignalRaw[],
    weather: { city: string; condition: string }[],
  ): IncidentDetected[] {
    const incidents: IncidentDetected[] = [];

    const weatherSignal = signals.find((s) => s.key === 'weather');
    const rainCities = weather.filter((w) => w.condition === 'rain').map((w) => w.city);

    if (weatherSignal && weatherSignal.value < 40 && rainCities.length > 0) {
      incidents.push({
        incident: `Rain + low foot traffic in ${rainCities.join(', ')}`,
        effect: '-23% orders',
        effectPercent: -23,
        recommendation: 'Push delivery promo with 15% discount',
      });
    }

    const socialSignal = signals.find((s) => s.key === 'social');
    if (socialSignal && socialSignal.value > 90) {
      incidents.push({
        incident: 'Viral food trend detected on social media',
        effect: '+31% demand spike expected',
        effectPercent: 31,
        recommendation: 'Stock up viral item ingredients immediately',
      });
    }

    return incidents;
  }
}
