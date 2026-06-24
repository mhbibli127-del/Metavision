export type MenuItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  featured: boolean;
  preparationTime: number; // minutes
  calories?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string;
  order: number;
};

export const menuCategories: MenuCategory[] = [
  { id: "appetizers", name: "Appetizers", description: "Start your meal", order: 1 },
  { id: "mains", name: "Main Courses", description: "Main dishes", order: 2 },
  { id: "desserts", name: "Desserts", description: "Sweet endings", order: 3 },
  { id: "beverages", name: "Beverages", description: "Drinks and refreshments", order: 4 },
];
