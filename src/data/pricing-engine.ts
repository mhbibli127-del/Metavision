export type PricingSuggestion = {
  id: string;
  item: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  reason: string;
  impact: string;
  confidence: number;
};

export const MOCK_PRICING_SUGGESTIONS: PricingSuggestion[] = [
  {
    id: "1",
    item: "Margherita Pizza",
    currentPrice: 12.5,
    suggestedPrice: 14.0,
    changePercent: 12,
    reason: "Evening demand +32%, low elasticity",
    impact: "+$2.1K / month",
    confidence: 0.91,
  },
  {
    id: "2",
    item: "Chicken Wrap",
    currentPrice: 9.0,
    suggestedPrice: 8.2,
    changePercent: -9,
    reason: "Sales dropped 18% vs last week",
    impact: "Recover volume +14%",
    confidence: 0.78,
  },
  {
    id: "3",
    item: "Espresso",
    currentPrice: 3.5,
    suggestedPrice: 4.0,
    changePercent: 14,
    reason: "Rain forecast → delivery spike",
    impact: "+$420 / week",
    confidence: 0.85,
  },
];
