import { Schema } from "mongoose";
import { id, registerModel } from "./shared";

const ExpenseSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    vendorId: String,
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "AZN" },
    date: { type: Date, required: true },
    status: { type: String, default: "PENDING" },
  },
  { timestamps: true },
);
ExpenseSchema.index({ restaurantId: 1, date: -1 });
export const ExpenseModel = registerModel("Expense", ExpenseSchema);

const PurchaseOrderSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    vendorId: { type: String, required: true },
    status: { type: String, default: "DRAFT" },
    items: { type: String, default: "[]" },
    total: { type: Number, default: 0 },
    currency: { type: String, default: "AZN" },
    expectedAt: Date,
  },
  { timestamps: true },
);
export const PurchaseOrderModel = registerModel("PurchaseOrder", PurchaseOrderSchema);

const CustomerCampaignSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    segment: { type: String, required: true },
    channel: { type: String, default: "sms" },
    message: { type: String, required: true },
    status: { type: String, default: "DRAFT" },
    sentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const CustomerCampaignModel = registerModel("CustomerCampaign", CustomerCampaignSchema);
