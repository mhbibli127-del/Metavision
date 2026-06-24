export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: Date;
  status: InventoryStatus;
}

export const inventoryCategories = [
  "Vegetables",
  "Meat",
  "Dairy",
  "Spices",
  "Beverages",
  "Grains",
  "Oils",
  "Other",
];

export const inventoryStatuses: { value: InventoryStatus; label: string; color: string }[] = [
  { value: "in_stock", label: "In Stock", color: "green" },
  { value: "low_stock", label: "Low Stock", color: "orange" },
  { value: "out_of_stock", label: "Out of Stock", color: "red" },
  { value: "discontinued", label: "Discontinued", color: "gray" },
];
