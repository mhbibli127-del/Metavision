import { Schema } from "mongoose";
import { id, registerModel } from "./shared";

const MenuItemSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: String,
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 15 },
    calories: Number,
    tags: { type: String, default: "[]" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
MenuItemSchema.index({ restaurantId: 1, category: 1 });
export const MenuItemModel = registerModel("MenuItem", MenuItemSchema);

const InventorySchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    minQuantity: { type: Number, required: true },
    costPerUnit: { type: Number, required: true },
    supplier: String,
    lastRestocked: Date,
    status: { type: String, default: "IN_STOCK" },
  },
  { timestamps: true },
);
InventorySchema.index({ restaurantId: 1, status: 1 });
InventorySchema.index({ restaurantId: 1, category: 1 });
export const InventoryModel = registerModel("Inventory", InventorySchema);

const VendorSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    contact: String,
    phone: String,
    email: String,
    category: String,
    notes: String,
  },
  { timestamps: true },
);
export const VendorModel = registerModel("Vendor", VendorSchema);

const MenuTemplateSchema = new Schema(
  {
    _id: id,
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    version: { type: Number, default: 1 },
    sourceRestaurantId: { type: String, required: true },
    itemCount: { type: Number, default: 0 },
    notes: String,
  },
  { timestamps: true },
);
MenuTemplateSchema.index({ organizationId: 1, name: 1, version: 1 }, { unique: true });
export const MenuTemplateModel = registerModel("MenuTemplate", MenuTemplateSchema);
