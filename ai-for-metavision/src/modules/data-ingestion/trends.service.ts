import { Injectable, Logger } from '@nestjs/common';
import { TrendSignal } from './ingestion.types';

/**
 * TrendsService — ingests food trend signals.
 * Structured for real Google Trends / social API. Uses seeded mock when key absent.
 */
@Injectable()
export class TrendsService {
  private readonly logger = new Logger(TrendsService.name);
  private readonly apiKey = process.env.TRENDS_API_KEY;

  async fetchAll(): Promise<TrendSignal[]> {
    if (this.apiKey) {
      return this.fetchFromApi();
    }
    return this.mockTrends();
  }

  private async fetchFromApi(): Promise<TrendSignal[]> {
    try {
      const res = await fetch(`https://api.trendsapi.example/food?key=${this.apiKey}`);
      if (!res.ok) {
        this.logger.warn(`Trends API returned ${res.status}, falling back to mock`);
        return this.mockTrends();
      }
      return (await res.json()) as TrendSignal[];
    } catch (err) {
      this.logger.error('Trends API fetch failed', err);
      return this.mockTrends();
    }
  }

  private mockTrends(): TrendSignal[] {
    const base: TrendSignal[] = [
      { city: 'Berlin', region: 'Europe', cuisine: 'Sushi', momentum: 88, demandChange: 14, confidence: 91, source: 'mock' },
      { city: 'Dubai', region: 'Middle East', cuisine: 'Korean', momentum: 93, demandChange: 18, confidence: 94, source: 'mock' },
      { city: 'New York', region: 'North America', cuisine: 'Burger', momentum: 57, demandChange: 3, confidence: 86, source: 'mock' },
      { city: 'Seoul', region: 'Asia', cuisine: 'Vegan Urban Bowls', momentum: 66, demandChange: 9, confidence: 83, source: 'mock' },
      { city: 'Baku', region: 'CIS', cuisine: 'Spicy Noodles', momentum: 85, demandChange: 16, confidence: 89, source: 'mock' },
    ];

    // add ±jitter so each ingestion cycle is slightly different (simulates live data)
    return base.map((trend) => ({
      ...trend,
      momentum: Math.min(100, Math.max(10, trend.momentum + (Math.random() * 6 - 3))),
      demandChange: trend.demandChange + (Math.random() * 2 - 1),
    }));
  }
}
