import { create } from "zustand";
import type {
  TasteDnaScore,
  GlobalTrend,
  PredictionCard,
  ContextSignal,
  InsightEvent,
  LiveFeedItem,
  OpsSnapshot,
} from "@/data/tastemind";

export interface IncidentAlert {
  incident: string;
  effect: string;
  effectPercent: number;
  recommendation: string;
  detectedAt: string;
}

export interface MarketAlert {
  type: "opportunity" | "risk";
  message: string;
  confidence: number;
  timestamp: Date;
}

export interface ActionItem {
  type: string;
  label: string;
  impact: string;
  risk: "low" | "medium" | "high";
  confidence: number;
  tradeoff: string;
  explanation: string;
}

interface TasteMindState {
  tasteDnaScores: TasteDnaScore[];
  tasteDnaIndex: number;
  globalTrends: GlobalTrend[];
  predictionCards: PredictionCard[];
  contextSignals: ContextSignal[];
  insightStream: InsightEvent[];
  liveFeed: LiveFeedItem[];
  opsSnapshot: OpsSnapshot | null;
  incidents: IncidentAlert[];
  marketAlerts: MarketAlert[];
  actionPlan: ActionItem[];

  isLive: boolean;
  lastUpdated: Date | null;

  hydrateFromApi: (data: Record<string, unknown>) => void;
  setTasteDna: (scores: TasteDnaScore[], index: number) => void;
  setGlobalTrends: (trends: GlobalTrend[]) => void;
  setPredictions: (cards: PredictionCard[]) => void;
  setContextSignals: (signals: ContextSignal[]) => void;
  setLiveFeed: (items: LiveFeedItem[]) => void;
  setOpsSnapshot: (ops: OpsSnapshot) => void;
  setIncidents: (incidents: IncidentAlert[]) => void;
  setMarketAlerts: (alerts: MarketAlert[]) => void;
  addInsightEvent: (event: InsightEvent) => void;
  setInsightStream: (events: InsightEvent[]) => void;
  setActionPlan: (actions: ActionItem[]) => void;
  setIsLive: (live: boolean) => void;
  touch: () => void;
}

function feedToInsights(feed: LiveFeedItem[]): InsightEvent[] {
  return feed.map((item) => ({
    id: item.id,
    timestamp: item.time,
    text: `${item.title} — ${item.detail}`,
    severity: item.severity,
    linkedModule: item.category,
  }));
}

export const useTasteMindStore = create<TasteMindState>((set) => ({
  tasteDnaScores: [],
  tasteDnaIndex: 0,
  globalTrends: [],
  predictionCards: [],
  contextSignals: [],
  insightStream: [],
  liveFeed: [],
  opsSnapshot: null,
  incidents: [],
  marketAlerts: [],
  actionPlan: [],
  isLive: false,
  lastUpdated: null,

  hydrateFromApi: (data) =>
    set((state) => {
      const liveFeed = (data.liveFeed as LiveFeedItem[]) ?? state.liveFeed;
      const scores = (data.tasteDnaScores as TasteDnaScore[]) ?? state.tasteDnaScores;
      const index = scores.length
        ? Math.round(scores.reduce((s, c) => s + c.value, 0) / scores.length)
        : state.tasteDnaIndex;

      const marketAlerts = Array.isArray(data.marketAlerts)
        ? (data.marketAlerts as string[]).map((msg, i) => ({
            type: (msg.includes("-") || msg.toLowerCase().includes("risk") ? "risk" : "opportunity") as
              | "opportunity"
              | "risk",
            message: msg,
            confidence: 75 + i * 4,
            timestamp: new Date(),
          }))
        : state.marketAlerts;

      return {
        tasteDnaScores: scores,
        tasteDnaIndex: index,
        globalTrends: (data.globalTrends as GlobalTrend[]) ?? state.globalTrends,
        predictionCards: (data.predictionCards as PredictionCard[]) ?? state.predictionCards,
        contextSignals: (data.contextSignals as ContextSignal[]) ?? state.contextSignals,
        liveFeed,
        insightStream: feedToInsights(liveFeed),
        opsSnapshot: (data.opsSnapshot as OpsSnapshot) ?? state.opsSnapshot,
        incidents: (data.incidents as IncidentAlert[]) ?? state.incidents,
        marketAlerts,
        lastUpdated: new Date(),
        isLive: true,
      };
    }),

  setTasteDna: (scores, index) =>
    set({ tasteDnaScores: scores, tasteDnaIndex: index, lastUpdated: new Date() }),

  setGlobalTrends: (trends) => set({ globalTrends: trends, lastUpdated: new Date() }),

  setPredictions: (cards) => set({ predictionCards: cards, lastUpdated: new Date() }),

  setContextSignals: (signals) => set({ contextSignals: signals, lastUpdated: new Date() }),

  setLiveFeed: (items) =>
    set({ liveFeed: items, insightStream: feedToInsights(items), lastUpdated: new Date() }),

  setOpsSnapshot: (ops) => set({ opsSnapshot: ops, lastUpdated: new Date() }),

  setIncidents: (incidents) => set({ incidents, lastUpdated: new Date() }),

  setMarketAlerts: (alerts) => set({ marketAlerts: alerts, lastUpdated: new Date() }),

  addInsightEvent: (event) =>
    set((state) => ({
      insightStream: [event, ...state.insightStream].slice(0, 50),
      lastUpdated: new Date(),
    })),

  setInsightStream: (events) => set({ insightStream: events, lastUpdated: new Date() }),

  setActionPlan: (actions) => set({ actionPlan: actions, lastUpdated: new Date() }),

  setIsLive: (live) => set({ isLive: live }),

  touch: () => set({ lastUpdated: new Date() }),
}));
