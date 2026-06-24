import type { Currency } from "@/lib/prisma-types";
import { connectDb } from "@/lib/mongodb";
import { ExchangeRateModel } from "@/lib/models";

const FRANKFURTER = "https://api.frankfurter.app/latest";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type RateMap = Record<string, number>;

async function fetchLiveRates(base: Currency): Promise<RateMap> {
  const symbols = ["AZN", "USD", "EUR"].filter((c) => c !== base).join(",");
  const res = await fetch(`${FRANKFURTER}?from=${base}&to=${symbols}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Exchange rate API failed: ${res.status}`);

  const data = (await res.json()) as { rates: Record<string, number> };
  const map: RateMap = { [base]: 1 };
  for (const [k, v] of Object.entries(data.rates)) {
    map[k] = v;
  }
  return map;
}

async function getCachedRate(base: Currency, quote: Currency): Promise<number | null> {
  await connectDb();
  const row = await ExchangeRateModel.findOne({ baseCurrency: base, quoteCurrency: quote }).lean();
  if (!row) return null;
  if (Date.now() - new Date(String(row.fetchedAt)).getTime() > CACHE_TTL_MS) return null;
  return Number(row.rate);
}

async function cacheRates(base: Currency, rates: RateMap): Promise<void> {
  await connectDb();
  const now = new Date();
  for (const [quote, rate] of Object.entries(rates)) {
    if (quote === base) continue;
    await ExchangeRateModel.findOneAndUpdate(
      { baseCurrency: base, quoteCurrency: quote },
      { $set: { rate, fetchedAt: now } },
      { upsert: true },
    );
  }
}

/** Get FX rate: 1 base = X quote */
export async function getExchangeRate(base: Currency, quote: Currency): Promise<number> {
  if (base === quote) return 1;

  const cached = await getCachedRate(base, quote);
  if (cached != null) return cached;

  try {
    const live = await fetchLiveRates(base);
    await cacheRates(base, live);
    const rate = live[quote];
    if (rate == null) throw new Error(`No rate for ${base}->${quote}`);
    return rate;
  } catch {
    const inverse = await getCachedRate(quote, base);
    if (inverse != null && inverse > 0) return 1 / inverse;
    // Fallback approximate rates (AZN pegged ~1.7 USD)
    const fallback: Record<string, Record<string, number>> = {
      AZN: { USD: 0.59, EUR: 0.54 },
      USD: { AZN: 1.7, EUR: 0.92 },
      EUR: { AZN: 1.85, USD: 1.09 },
    };
    return fallback[base]?.[quote] ?? 1;
  }
}

export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): Promise<{ amount: number; rate: number }> {
  const rate = await getExchangeRate(from, to);
  return { amount: convertAmount(amount, rate), rate };
}

export async function getAllRates(base: Currency = "AZN"): Promise<{
  base: Currency;
  rates: Record<Currency, number>;
  fetchedAt: string;
  source: string;
}> {
  const currencies: Currency[] = ["AZN", "USD", "EUR"];
  const rates = {} as Record<Currency, number>;
  for (const c of currencies) {
    rates[c] = await getExchangeRate(base, c);
  }
  return {
    base,
    rates,
    fetchedAt: new Date().toISOString(),
    source: "frankfurter.app",
  };
}
