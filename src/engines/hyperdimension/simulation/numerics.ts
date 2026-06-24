/** Numeric stability guards — no NaN/Infinity propagation */

export function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function safeDiv(a: number, b: number, fallback = 0): number {
  if (!isFiniteNumber(a) || !isFiniteNumber(b) || Math.abs(b) < 1e-12) return fallback;
  const r = a / b;
  return isFiniteNumber(r) ? r : fallback;
}

export function clamp(n: number, lo: number, hi: number): number {
  if (!isFiniteNumber(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export function saturateTanh(n: number, scale = 1): number {
  if (!isFiniteNumber(n)) return 0;
  return Math.tanh(n / scale) * scale;
}

export function lorentzGamma(v: number, c: number): number {
  const vc = clamp(v, 0, c * 0.999);
  const ratio = (vc * vc) / (c * c);
  const inner = 1 - ratio;
  if (inner <= 1e-9) return 1e6;
  return 1 / Math.sqrt(inner);
}

export function shannonEntropy(bins: number[]): number {
  const total = bins.reduce((s, x) => s + x, 0);
  if (total <= 0) return 0;
  let h = 0;
  for (const b of bins) {
    if (b <= 0) continue;
    const p = b / total;
    h -= p * Math.log2(p);
  }
  return h;
}

export function assertStable(values: number[], label: string): string[] {
  const warnings: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!isFiniteNumber(v)) warnings.push(`${label}[${i}]: non-finite value`);
    if (Math.abs(v) > 1e6) warnings.push(`${label}[${i}]: overflow risk`);
  }
  return warnings;
}
