import { Schema } from "mongoose";
import { id, registerModel } from "./shared";

const OrderItemSchema = new Schema({
  _id: id,
  menuItemId: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  notes: String,
});

const OrderSchema = new Schema(
  {
    _id: id,
    userId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    status: { type: String, default: "PENDING" },
    total: { type: Number, required: true },
    currency: { type: String, default: "AZN" },
    paymentMethod: { type: String, default: "card" },
    notes: String,
    tableId: String,
    reservationId: String,
    items: [OrderItemSchema],
  },
  { timestamps: true },
);
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
export const OrderModel = registerModel("Order", OrderSchema);

const ReservationSchema = new Schema(
  {
    _id: id,
    userId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    partySize: { type: Number, required: true },
    status: { type: String, default: "CONFIRMED" },
    notes: String,
    tableId: String,
    depositAmount: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    smsReminderAt: Date,
    smsReminderSent: { type: Boolean, default: false },
    waitlistId: String,
  },
  { timestamps: true },
);
ReservationSchema.index({ restaurantId: 1, date: 1 });
ReservationSchema.index({ restaurantId: 1, status: 1 });
export const ReservationModel = registerModel("Reservation", ReservationSchema);

const TableSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    number: { type: String, required: true },
    capacity: { type: Number, required: true },
    zone: { type: String, required: true },
    shape: { type: String, default: "ROUND" },
    status: { type: String, default: "AVAILABLE" },
    posX: { type: Number, default: 0 },
    posY: { type: Number, default: 0 },
    width: { type: Number, default: 80 },
    height: { type: Number, default: 80 },
    turnTimeMin: { type: Number, default: 90 },
    mergedWithId: String,
  },
  { timestamps: true },
);
export const TableModel = registerModel("Table", TableSchema);

const StaffSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    role: { type: String, required: true },
    status: { type: String, default: "ACTIVE" },
    hireDate: { type: Date, required: true },
    salary: Number,
    avatar: String,
  },
  { timestamps: true },
);
export const StaffModel = registerModel("Staff", StaffSchema);

const CustomerSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    visits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastVisit: Date,
    notes: String,
  },
  { timestamps: true },
);
export const CustomerModel = registerModel("Customer", CustomerSchema);

const ShiftSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    role: String,
    notes: String,
  },
  { timestamps: true },
);
ShiftSchema.index({ restaurantId: 1, date: 1 });
export const ShiftModel = registerModel("Shift", ShiftSchema);

const WaitlistSchema = new Schema(
  {
    _id: id,
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    partySize: { type: Number, required: true },
    quotedWaitMin: { type: Number, default: 15 },
    status: { type: String, default: "WAITING" },
    notes: String,
  },
  { timestamps: true },
);
WaitlistSchema.index({ restaurantId: 1, status: 1 });
export const WaitlistModel = registerModel("Waitlist", WaitlistSchema);
