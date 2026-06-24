import type { ScenarioResult } from "./executive-brain";

export type ChatReply = {
  answer: string;
  recommended: ScenarioResult[];
  reasoning: string;
};

const TOPICS: Record<string, string[]> = {
  inflasiya: ["inflasiya", "inflation", "xərc", "xerc", "bahalaşma", "bahalas", "təzyiq", "tezyiq", "marja"],
  gelir: ["gəlir", "gelir", "revenue", "qazanc", "satış", "satis", "pul", "gəlir artımı"],
  qiymet: ["qiymət", "qiymet", "price", "menyu", "artır", "endirim", "promo", "kampaniya"],
  risk: ["risk", "təhlükə", "tehlike", "itki", "zərər", "zerer", "problem"],
  fursət: ["fürsət", "fursət", "fursat", "imkan", "artım", "böyümə", "boyume", "potensial"],
  xerc: ["xərc", "xerc", "cost", "optimallaşdır", "azalt", "təchizat", "techizat", "anbar"],
  həcm: ["həcm", "hecm", "volume", "sifariş", "sifaris", "doluluq", "rezerv"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wəğıöüşçƏĞİÖÜŞÇ\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreScenario(scenario: ScenarioResult, topics: Set<string>): number {
  let score = scenario.score * 0.01;

  if (topics.has("inflasiya") || topics.has("risk")) {
    if (scenario.label === "İnflyasiya riski") score += 40;
    score += scenario.inflationPct * 0.5;
  }
  if (topics.has("gelir") || topics.has("fursət")) {
    if (scenario.label === "Gəlir fürsəti") score += 45;
    score += scenario.projectedRevenue * 0.002;
  }
  if (topics.has("qiymet")) {
    score += Math.abs(scenario.priceAdjustPct) * 0.8;
    if (scenario.priceAdjustPct > 0 && topics.has("gelir")) score += 10;
    if (scenario.priceAdjustPct < 0 && topics.has("həcm")) score += 10;
  }
  if (topics.has("xerc") && scenario.strategy === "Xərc azaltma") score += 35;
  if (topics.has("həcm") && scenario.strategy === "Həcm") score += 30;
  if (topics.has("fursət") && scenario.label === "Gəlir fürsəti") score += 20;

  return score;
}

function detectTopics(tokens: string[]): Set<string> {
  const found = new Set<string>();
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    if (keywords.some((kw) => tokens.some((t) => t.includes(kw) || kw.includes(t)))) {
      found.add(topic);
    }
  }
  return found;
}

export function answerScenarioQuestion(
  question: string,
  scenarios: ScenarioResult[],
  ctx?: { city?: string; hasRestaurant?: boolean },
): ChatReply {
  const tokens = tokenize(question);
  const topics = detectTopics(tokens);
  const city = ctx?.city ?? "Bakı";

  if (!question.trim()) {
    return {
      answer: "Sualınızı yazın — məsələn: «İnflyasiya riskini necə azaldım?» və ya «Gəliri artırmaq üçün hansı ssenari uyğundur?»",
      recommended: [...scenarios].sort((a, b) => b.score - a.score).slice(0, 3),
      reasoning: "Boş sorğu",
    };
  }

  const ranked = [...scenarios]
    .map((s) => ({ s, score: scoreScenario(s, topics) }))
    .sort((a, b) => b.score - a.score);

  const recommended = ranked.slice(0, 3).map((r) => r.s);
  const best = recommended[0]!;

  let answer: string;
  if (!ctx?.hasRestaurant) {
    answer = `Restoran qeydiyyatı hələ tam deyil — ${city} bazar ssenariləri əsasında cavab verirəm. `;
  } else {
    answer = "";
  }

  if (topics.has("inflasiya") || topics.has("risk")) {
    const risky = scenarios
      .filter((s) => s.label === "İnflyasiya riski")
      .sort((a, b) => a.projectedMargin - b.projectedMargin)[0];
    answer += `İnflyasiya mövzusunda ən riskli ssenari #${risky?.id ?? best.id} (${risky?.inflationPct ?? best.inflationPct}% təzyiq). `;
    answer += `Tövsiyə: #${best.id} — ${best.summary}`;
  } else if (topics.has("gelir") || topics.has("fursət")) {
    answer += `Gəlir artımı üçün ən uyğun ssenari #${best.id}: ${best.summary}. `;
    answer += `Qiymət dəyişimi ${best.priceAdjustPct > 0 ? "+" : ""}${best.priceAdjustPct}%, strategiya «${best.strategy}».`;
  } else if (topics.has("qiymet")) {
    answer += `Qiymət strategiyası üçün #${best.id} seçildi: ${best.summary}`;
  } else if (topics.has("xerc")) {
    const cost = ranked.find((r) => r.s.strategy === "Xərc azaltma")?.s ?? best;
    answer += `Xərc optimallaşdırması: ssenari #${cost.id} — ${cost.summary}`;
  } else {
    answer += `Sualınıza uyğun ən yaxşı ssenari #${best.id}: ${best.summary}. `;
    if (recommended[1]) answer += `Alternativ #${recommended[1].id} (${recommended[1].label}).`;
  }

  const reasoning = topics.size
    ? `Açar mövzular: ${[...topics].join(", ")}. ${scenarios.length} ssenari arasından uyğunluq skoru ilə seçildi.`
    : `Ümumi uyğunluq skoru ilə ${scenarios.length} ssenaridən seçildi.`;

  return { answer, recommended, reasoning };
}
