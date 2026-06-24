import { Injectable, Logger } from '@nestjs/common';
import { WeatherSignal } from './ingestion.types';

/**
 * WeatherService — fetches weather data.
 * Structured for real OpenWeatherMap API. Uses mock when API key absent.
 */
@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  private readonly apiKey = process.env.WEATHER_API_KEY;
  private readonly cities = ['Baku', 'Dubai', 'Berlin', 'Seoul', 'New York'];

  async fetchAll(): Promise<WeatherSignal[]> {
    if (this.apiKey) {
      return this.fetchFromApi();
    }
    return this.mockWeather();
  }

  private async fetchFromApi(): Promise<WeatherSignal[]> {
    const results: WeatherSignal[] = [];

    for (const city of this.cities) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
        const res = await fetch(url);

        if (!res.ok) {
          this.logger.warn(`Weather API failed for ${city}: ${res.status}`);
          continue;
        }

        const data: any = await res.json();

        results.push({
          city,
          condition: data.weather?.[0]?.main?.toLowerCase() ?? 'unknown',
          temperatureCelsius: data.main?.temp ?? 20,
          humidityPercent: data.main?.humidity ?? 50,
          fetchedAt: new Date(),
        });
      } catch (err) {
        this.logger.error(`Weather fetch error for ${city}`, err);
      }
    }

    return results;
  }

  private mockWeather(): WeatherSignal[] {
    const conditions = ['sunny', 'cloudy', 'rain', 'sunny', 'cloudy'];
    return this.cities.map((city, idx) => ({
      city,
      condition: conditions[idx],
      temperatureCelsius: 18 + Math.round(Math.random() * 14),
      humidityPercent: 45 + Math.round(Math.random() * 35),
      fetchedAt: new Date(),
    }));
  }
}
