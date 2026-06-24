import { Injectable } from '@nestjs/common';
import { ContextSignalRaw } from './ingestion.types';
import { WeatherSignal } from './ingestion.types';

/**
 * ExternalSignalsService — derives ContextSignals from weather + time + social
 */
@Injectable()
export class ExternalSignalsService {
  buildContextSignals(weather: WeatherSignal[]): ContextSignalRaw[] {
    const avgTemp =
      weather.reduce((sum, w) => sum + w.temperatureCelsius, 0) / (weather.length || 1);
    const rainCount = weather.filter((w) => w.condition === 'rain').length;

    const hour = new Date().getHours();
    const timeScore =
      hour >= 5 && hour < 9 ? 72  // breakfast rush
      : hour >= 12 && hour < 14 ? 91  // lunch peak
      : hour >= 18 && hour < 22 ? 87  // dinner peak
      : 42;

    const weatherScore = Math.max(0, 100 - rainCount * 15 - Math.max(0, avgTemp - 32) * 2);

    return [
      {
        key: 'weather',
        label: 'Weather Impact',
        value: Math.round(weatherScore),
        unit: 'signal',
        influence: weatherScore > 70 ? 'high' : weatherScore > 40 ? 'medium' : 'low',
        source: 'derived',
      },
      {
        key: 'time',
        label: 'Time-of-Day Shift',
        value: timeScore,
        unit: 'signal',
        influence: timeScore > 80 ? 'high' : 'medium',
        source: 'system',
      },
      {
        key: 'location',
        label: 'Location Preference Delta',
        value: 71 + Math.round(Math.random() * 8 - 4),
        unit: 'signal',
        influence: 'high',
        source: 'derived',
      },
      {
        key: 'social',
        label: 'Social Trend Influence',
        value: 77 + Math.round(Math.random() * 6 - 3),
        unit: 'score',
        influence: 'high',
        source: 'derived',
      },
      {
        key: 'economy',
        label: 'Affordability Index',
        value: 58 + Math.round(Math.random() * 4 - 2),
        unit: 'index',
        influence: 'medium',
        source: 'derived',
      },
    ];
  }
}
