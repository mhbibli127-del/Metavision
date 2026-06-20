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

/** Static mock data — replace with API/database later */
export const staticRestaurantInfo: RestaurantInfo = {
  address: "28 May str. 45, Baku, Azerbaijan",
  openingHours: "10:00 – 23:00 (Mon–Sun)",
  phone: "050 123 45 67",
  email: "info@metavision-restaurant.az",
  website: "https://metavision-restaurant.az",
  parking: "Free parking available behind the building for up to 20 cars.",
  amenities: "Wi-Fi, outdoor terrace, kids zone, live music on weekends, wheelchair access.",
  paymentMethods: ["Cash", "QR", "Card"],
  activeCampaigns: "Summer menu launch — 15% off all grill items until 30 June.",
  imageName: "",
};

export const PAYMENT_OPTIONS: PaymentMethod[] = ["Cash", "QR", "Online", "Card"];
