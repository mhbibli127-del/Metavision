export type PaymentMethod = "Cash" | "QR" | "Online" | "Card";

export type RestaurantInfo = {
  address: string;
  openingHours: string;
  phone: string;
  email: string;
  website: string;
  parking: string;
  amenities: string;
  paymentMethods: PaymentMethod[];
  activeCampaigns: string;
  imageName: string;
};

export const PAYMENT_OPTIONS: PaymentMethod[] = ["Cash", "QR", "Online", "Card"];
