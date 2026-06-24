export type DeliveryPlatform = {
  id: string;
  name: string;
  commissionPct: number;
  avgDeliveryMin: number;
  monthlyOrdersEst?: number;
  city: string;
};

export const BAKU_DELIVERY_DEFAULTS: DeliveryPlatform[] = [
  { id: "wolt", name: "Wolt", commissionPct: 30, avgDeliveryMin: 35, monthlyOrdersEst: 420, city: "Baku" },
  { id: "bolt", name: "Bolt Food", commissionPct: 25, avgDeliveryMin: 28, monthlyOrdersEst: 380, city: "Baku" },
  { id: "umico", name: "Umico Market", commissionPct: 22, avgDeliveryMin: 40, monthlyOrdersEst: 120, city: "Baku" },
  { id: "direct", name: "Direct / WhatsApp", commissionPct: 0, avgDeliveryMin: 0, monthlyOrdersEst: 200, city: "Baku" },
];
