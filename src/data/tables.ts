export type TableStatus = "Available" | "Occupied" | "Reserved";

export type TableZone = "Garden" | "VIP" | "Terrace";

export type RestaurantTable = {
  id: string;
  number: string;
  status: TableStatus;
  zone: TableZone;
  seats: number;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  turnTimeMin?: number;
  mergedWithId?: string;
};

export function getDefaultZoneForStatus(status: TableStatus): TableZone {
  if (status === "Occupied") return "VIP";
  if (status === "Reserved") return "Terrace";
  return "Garden";
}
