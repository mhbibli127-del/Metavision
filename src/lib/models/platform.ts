import { Schema } from "mongoose";
import { id, ts, registerModel } from "./shared";

const UserSchema = new Schema(
  {
    _id: id,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: String,
    password: String,
    avatar: String,
    language: { type: String, default: "az" },
    emailNotifications: { type: Boolean, default: true },
    whatsappNotifications: { type: Boolean, default: true },
    role: { type: String, default: "USER" },
  },
  { timestamps: true },
);
export const UserModel = registerModel("User", UserSchema);

const SubscriptionSchema = new Schema(
  {
    _id: id,
    userId: { type: String, required: true, unique: true, index: true },
    plan: { type: String, required: true },
    status: { type: String, default: "ACTIVE" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  { timestamps: true },
);
export const SubscriptionModel = registerModel("Subscription", SubscriptionSchema);

const NotificationSchema = new Schema({
  _id: id,
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  metadata: String,
  createdAt: ts,
});
export const NotificationModel = registerModel("Notification", NotificationSchema);

const AdminClientSchema = new Schema(
  {
    _id: id,
    company: { type: String, required: true },
    plan: { type: String, required: true },
    startDate: { type: Date, required: true },
    monthlyPayment: { type: Number, required: true },
    status: { type: String, default: "ACTIVE" },
    aiQueries: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const AdminClientModel = registerModel("AdminClient", AdminClientSchema);

const PlatformMetricSchema = new Schema({
  _id: id,
  activeClients: { type: Number, required: true },
  activeClientsGrowth: { type: Number, required: true },
  monthlyRevenue: { type: Number, required: true },
  revenueGrowth: { type: Number, required: true },
  aiQueries: { type: Number, required: true },
  aiQueriesGrowth: { type: Number, required: true },
  onboardingRate: { type: Number, required: true },
  onboardingGrowth: { type: Number, required: true },
  goldPlanCount: { type: Number, required: true },
  standardPlanCount: { type: Number, required: true },
  recordedAt: ts,
});
export const PlatformMetricModel = registerModel("PlatformMetric", PlatformMetricSchema);

const SiteContentSchema = new Schema({
  _id: id,
  section: { type: String, required: true, unique: true },
  items: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});
export const SiteContentModel = registerModel("SiteContent", SiteContentSchema);

const AuditLogSchema = new Schema({
  _id: id,
  userId: String,
  organizationId: String,
  branchId: String,
  restaurantId: String,
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: String,
  summary: String,
  metadata: String,
  ip: String,
  createdAt: ts,
});
AuditLogSchema.index({ restaurantId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
export const AuditLogModel = registerModel("AuditLog", AuditLogSchema);

const RefreshTokenSchema = new Schema({
  _id: id,
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  createdAt: ts,
});
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshTokenModel = registerModel("RefreshToken", RefreshTokenSchema);
