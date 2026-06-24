import type { MetaInsightRow } from "./types";

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "");
}

function parseNum(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.,\-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function pick(row: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) {
    if (row[k] != null && row[k] !== "") return row[k];
  }
  return undefined;
}

function detectDelimiter(line: string): "," | "\t" | ";" {
  const tabs = (line.match(/\t/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  const semis = (line.match(/;/g) ?? []).length;
  if (tabs >= commas && tabs >= semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delim) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim().replace(/^"|"$/g, ""));
}

export type ParsedMetaExport = {
  campaigns: MetaInsightRow[];
  currency?: string;
};

/** Meta Ads Manager CSV/TSV export — SMS/API olmadan */
export function parseMetaAdsExport(csvText: string): ParsedMetaExport {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Fayl boşdur. Meta Ads Manager → Reports → Export → CSV");
  }

  const delim = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delim).map(normalizeHeader);
  const headerIndex = new Map(headers.map((h, i) => [h, i]));

  const get = (cols: string[], ...aliases: string[]) => {
    for (const alias of aliases) {
      const idx = headerIndex.get(alias);
      if (idx != null) return cols[idx];
    }
    return undefined;
  };

  const campaigns: MetaInsightRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delim);
    if (cols.every((c) => !c)) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });

    const name =
      pick(row, ["campaign name", "ad set name", "ad name", "kampaniya adı", "name"]) ??
      get(cols, "campaign name", "ad set name", "name");

    if (!name || name.toLowerCase() === "total" || name.startsWith("---")) continue;

    const spend = parseNum(
      get(cols, "amount spent", "amount spent usd", "amount spent azn", "spend"),
    );
    const impressions = Math.round(parseNum(get(cols, "impressions", "göstərilmə")));
    const clicks = Math.round(
      parseNum(get(cols, "link clicks", "clicks all", "clicks", "results")),
    );
    const reach = Math.round(parseNum(get(cols, "reach", "əhatə")));
    let ctr = parseNum(get(cols, "ctr all", "ctr link click-through rate", "ctr"));
    let cpc = parseNum(get(cols, "cpc all", "cpc cost per link click", "cpc"));
    const cpm = parseNum(get(cols, "cpm cost per 1000 impressions", "cpm"));
    const conversions = parseNum(get(cols, "purchases", "conversions", "results", "leads"));
    const roasRaw = parseNum(get(cols, "purchase roas", "roas"));
    const campaignId = get(cols, "campaign id") ?? `import-${i}-${name.slice(0, 24)}`;
    const status = get(cols, "delivery", "campaign delivery", "status");

    if (ctr > 0 && ctr < 1) ctr *= 100;
    if (!ctr && impressions > 0 && clicks > 0) ctr = (clicks / impressions) * 100;
    if (!cpc && clicks > 0 && spend > 0) cpc = spend / clicks;

    if (!spend && !impressions && !clicks) continue;

    campaigns.push({
      entityId: String(campaignId),
      entityName: name,
      spend,
      impressions,
      clicks,
      reach,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      conversions,
      roas: roasRaw > 0 ? roasRaw : null,
      status: status ?? undefined,
    });
  }

  if (!campaigns.length) {
    throw new Error("Kampaniya tapılmadı. Export-da Campaign name + Amount spent olmalıdır.");
  }

  const currencyCol = headers.find((h) => h.includes("amount spent"));
  let currency = "USD";
  if (currencyCol?.includes("azn")) currency = "AZN";
  if (currencyCol?.includes("eur")) currency = "EUR";

  return { campaigns, currency };
}
