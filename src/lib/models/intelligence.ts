import { Schema } from "mongoose";
import { id, ts, registerModel } from "./shared";

const CompetitorMenuItemSchema = new Schema(
  {
    _id: id,
    competitorId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    currency: { type: String, default: "AZN" },
    tags: { type: String, default: "[]" },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const CompetitorMenuItemModel = registerModel("CompetitorMenuItem", CompetitorMenuItemSchema);

const CompetitorRestaurantSchema = new Schema(
  {
    _id: id,
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    city: { type: String, default: "Baku" },
    district: String,
    cuisine: { type: String, default: "[]" },
    rating: Number,
    reviewCount: { type: Number, default: 0 },
    priceRange: { type: String, default: "MID" },
    currency: { type: String, default: "AZN" },
    website: String,
    advantages: { type: String, default: "[]" },
    weaknesses: { type: String, default: "[]" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const CompetitorRestaurantModel = registerModel("CompetitorRestaurant", CompetitorRestaurantSchema);

const MarketTrendSchema = new Schema({
  _id: id,
  city: { type: String, default: "Baku" },
  region: { type: String, default: "Absheron" },
  cuisine: { type: String, required: true },
  momentum: { type: Number, required: true },
  demandChange: { type: Number, required: true },
  confidence: { type: Number, required: true },
  currency: { type: String, default: "AZN" },
  avgDishPriceAzn: Number,
  source: String,
  observedAt: ts,
});
export const MarketTrendModel = registerModel("MarketTrend", MarketTrendSchema);

const ExchangeRateSchema = new Schema({
  _id: id,
  baseCurrency: { type: String, required: true },
  quoteCurrency: { type: String, required: true },
  rate: { type: Number, required: true },
  fetchedAt: ts,
});
ExchangeRateSchema.index({ baseCurrency: 1, quoteCurrency: 1 }, { unique: true });
export const ExchangeRateModel = registerModel("ExchangeRate", ExchangeRateSchema);

const MetaAdsConnectionSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, unique: true },
    metaUserId: String,
    adAccountId: { type: String, required: true },
    adAccountName: String,
    accessToken: { type: String, required: true },
    tokenExpiresAt: Date,
    currency: { type: String, default: "USD" },
    status: { type: String, default: "connected" },
    lastSyncedAt: Date,
    lastError: String,
  },
  { timestamps: true },
);
export const MetaAdsConnectionModel = registerModel("MetaAdsConnection", MetaAdsConnectionSchema);

const MetaAdsInsightSchema = new Schema({
  _id: id,
  connectionId: { type: String, required: true, index: true },
  level: { type: String, required: true },
  entityId: { type: String, required: true },
  entityName: { type: String, required: true },
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  spend: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  roas: Number,
  status: String,
  rawPayload: String,
  fetchedAt: ts,
});
MetaAdsInsightSchema.index(
  { connectionId: 1, level: 1, entityId: 1, dateStart: 1, dateEnd: 1 },
  { unique: true },
);
export const MetaAdsInsightModel = registerModel("MetaAdsInsight", MetaAdsInsightSchema);

const AiActionSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    impact: String,
    confidence: { type: Number, default: 0.8 },
    status: { type: String, default: "pending" },
    resolvedAt: Date,
    resolvedBy: String,
  },
  { timestamps: true },
);
AiActionSchema.index({ restaurantId: 1, status: 1 });
export const AiActionModel = registerModel("AiAction", AiActionSchema);

const IntegrationConnectionSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    status: { type: String, default: "connected" },
    accessToken: String,
    refreshToken: String,
    externalAccountId: String,
    accountName: String,
    metadata: String,
  },
  { timestamps: true },
);
IntegrationConnectionSchema.index({ restaurantId: 1, provider: 1 }, { unique: true });
export const IntegrationConnectionModel = registerModel("IntegrationConnection", IntegrationConnectionSchema);
