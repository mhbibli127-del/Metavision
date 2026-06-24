import type { RestaurantSimulationInput } from "@/data/tastemind";

function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getTasteDnaIndex(scores: { value: number }[]) {
  if (!scores.length) return 0;
  return avg(scores.map((item) => item.value));
}

export function getGlobalMomentumIndex(trends: { momentum: number }[]) {
  if (!trends.length) return 0;
  return avg(trends.map((item) => item.momentum));
}

export function getPredictionConfidenceIndex(cards: { confidence: number }[]) {
  if (!cards.length) return 0;
  return avg(cards.map((item) => item.confidence));
}

export interface SimulationResult {
  input: RestaurantSimulationInput;
  successProbability: number;
  segment: string;
  monthlyRevenueRange: string;
  riskFactors: string[];
  optimizationSuggestions: string[];
  competitorDensity: number;
  retentionScore: number;
  revenuePerSeat: number;
}

export interface MultiScenarioResult {
  scenarioA: SimulationResult;
  scenarioB: SimulationResult;
  winner: "A" | "B";
  reason: string;
  delta: {
    successProbability: number;
    retentionScore: number;
    revenuePerSeat: number;
  };
}

function scoreInput(input: RestaurantSimulationInput, competitorCount = 6): SimulationResult {
  const base = input.priceRange === "premium" ? 62 : input.priceRange === "mid" ? 74 : 68;
  const noveltyBoost = input.concept.toLowerCase().includes("fusion") ? 9 : 3;
  const locationBoost = input.location.toLowerCase().includes("mərkəz") || input.location.toLowerCase().includes("center") ? 8 : 4;
  const localBoost = input.menuFocus.toLowerCase().includes("azərbaycan") || input.menuFocus.toLowerCase().includes("yerli") ? 6 : 2;

  const successProbability = Math.min(96, base + noveltyBoost + locationBoost + localBoost);
  const retentionScore = Math.round(successProbability * 0.88);
  const revenuePerSeat = Math.round(successProbability * 38);
  const low = Math.round(successProbability * 1900);
  const high = Math.round(successProbability * 2700);

  return {
    input,
    successProbability,
    segment: successProbability > 80 ? "Şəhər mərkəzi və trend auditoriya" : "Dəyər axtaran yerli müştəri",
    monthlyRevenueRange: `${low.toLocaleString("az-AZ")} – ${high.toLocaleString("az-AZ")} AZN`,
    riskFactors: [
      "Xammal qiymət dalğalanması",
      `${competitorCount} rəqib üzrə qiymət təzyiqi`,
      input.priceRange === "premium" ? "Premium seqmentdə həssaslıq" : "Çatdırılma komissiyası",
    ],
    optimizationSuggestions: [
      "Ən çox satılan məhsulu menyu üstündə saxlayın",
      "Aşağı stok məhsullarını gündəlik yoxlayın",
      "Rəqib qiymət fərqini həftəlik müqayisə edin",
    ],
    competitorDensity: Math.max(34, 92 - successProbability + competitorCount),
    retentionScore,
    revenuePerSeat,
  };
}

export function runRestaurantSimulation(
  input: RestaurantSimulationInput,
  competitorCount = 6,
): SimulationResult {
  return scoreInput(input, competitorCount);
}

export function runMultiScenarioSimulation(
  inputA: RestaurantSimulationInput,
  inputB: RestaurantSimulationInput,
  competitorCount = 6,
): MultiScenarioResult {
  const scenarioA = scoreInput(inputA, competitorCount);
  const scenarioB = scoreInput(inputB, competitorCount);

  const winner: "A" | "B" = scenarioA.successProbability >= scenarioB.successProbability ? "A" : "B";
  const best = winner === "A" ? scenarioA : scenarioB;
  const other = winner === "A" ? scenarioB : scenarioA;

  let reason = `Ssenari ${winner} — ${best.successProbability}% uğur ehtimalı`;
  if (best.retentionScore - other.retentionScore > 5) {
    reason += `, saxlama ${best.retentionScore - other.retentionScore} xal yüksək`;
  }

  return {
    scenarioA,
    scenarioB,
    winner,
    reason,
    delta: {
      successProbability: scenarioA.successProbability - scenarioB.successProbability,
      retentionScore: scenarioA.retentionScore - scenarioB.retentionScore,
      revenuePerSeat: scenarioA.revenuePerSeat - scenarioB.revenuePerSeat,
    },
  };
}
