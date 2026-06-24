import { z } from "zod";

export const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional().default(""),
  price: z.number().min(0),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  preparationTime: z.number().int().min(1).max(480).optional(),
  tags: z.array(z.string()).optional(),
});

export const staffSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().min(1),
  status: z.string().optional(),
  hireDate: z.union([z.string(), z.date()]).optional(),
  salary: z.number().min(0).optional(),
});

export const inventorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  category: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(20),
  minQuantity: z.number().min(0),
  costPerUnit: z.number().min(0),
  supplier: z.string().max(200).optional(),
  status: z.string().optional(),
});

export const tableSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1).max(20),
  seats: z.number().int().min(1).max(50).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  status: z.string().optional(),
  zone: z.string().optional(),
});

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional().or(z.literal("")),
  visits: z.number().int().min(0).optional(),
  totalSpent: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export const restaurantSchema = z.object({
  address: z.string().max(500).optional(),
  openingHours: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().max(500).optional(),
  parking: z.string().max(1000).optional(),
  amenities: z.string().max(2000).optional(),
  activeCampaigns: z.string().max(5000).optional(),
  paymentMethods: z.array(z.string()).optional(),
  imageName: z.string().max(300).optional(),
  name: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
});

export const vendorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  contact: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  category: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const expenseSchema = z.object({
  id: z.string().optional(),
  vendorId: z.string().optional(),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  currency: z.enum(["AZN", "USD", "EUR"]).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  status: z.enum(["pending", "paid", "cancelled"]).optional(),
});

export const shiftSchema = z.object({
  id: z.string().optional(),
  staffId: z.string().min(1),
  date: z.union([z.string(), z.date()]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  role: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(1).max(200),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  password: z.string().min(4).max(128),
});
