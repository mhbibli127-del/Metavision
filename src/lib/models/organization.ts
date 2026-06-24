import { Schema } from "mongoose";
import { id, registerModel } from "./shared";

const RestaurantSchema = new Schema(
  {
    _id: id,
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: "Baku" },
    openingHours: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String,
    parking: String,
    amenities: String,
    activeCampaigns: String,
    paymentMethods: { type: String, default: "[]" },
    imageName: String,
    currency: { type: String, default: "AZN" },
    cuisine: { type: String, default: "[]" },
  },
  { timestamps: true },
);
export const RestaurantModel = registerModel("Restaurant", RestaurantSchema);

const OrganizationSchema = new Schema(
  {
    _id: id,
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    plan: { type: String, default: "STANDARD" },
    ownerId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);
export const OrganizationModel = registerModel("Organization", OrganizationSchema);

const BranchSchema = new Schema(
  {
    _id: id,
    organizationId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    city: { type: String, default: "Baku" },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const BranchModel = registerModel("Branch", BranchSchema);

const MembershipSchema = new Schema(
  {
    _id: id,
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    branchId: String,
    role: { type: String, default: "OWNER" },
    permissions: { type: String, default: "[]" },
  },
  { timestamps: true },
);
MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
export const MembershipModel = registerModel("Membership", MembershipSchema);
