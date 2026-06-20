export type TableStatus = "Available" | "Occupied" | "Reserved";

export type TableZone = "Garden" | "VIP" | "Terrace";

export type RestaurantTable = {
  id: string;
  number: string;
  status: TableStatus;
  zone: TableZone;
  seats: number;
};

/** Static mock data — replace with API/database later */
export const staticTables: RestaurantTable[] = [
  { id: "t1", number: "1", status: "Available", zone: "Garden", seats: 4 },
  { id: "t2", number: "2", status: "Occupied", zone: "VIP", seats: 6 },
  { id: "t3", number: "3", status: "Reserved", zone: "Terrace", seats: 4 },
  { id: "t4", number: "4", status: "Available", zone: "Garden", seats: 2 },
  { id: "t5", number: "5", status: "Occupied", zone: "Garden", seats: 10 },
  { id: "t6", number: "6", status: "Available", zone: "Terrace", seats: 4 },
  { id: "t7", number: "7", status: "Reserved", zone: "VIP", seats: 6 },
  { id: "t8", number: "8", status: "Available", zone: "Garden", seats: 4 },
  { id: "t9", number: "9", status: "Occupied", zone: "Terrace", seats: 2 },
  { id: "t10", number: "10", status: "Available", zone: "Garden", seats: 6 },
  { id: "t11", number: "11", status: "Reserved", zone: "VIP", seats: 8 },
  { id: "t12", number: "12", status: "Available", zone: "VIP", seats: 6 },
  { id: "t13", number: "13", status: "Occupied", zone: "Terrace", seats: 4 },
  { id: "t14", number: "14", status: "Available", zone: "Garden", seats: 4 },
  { id: "t15", number: "15", status: "Reserved", zone: "Garden", seats: 2 },
  { id: "t16", number: "16", status: "Available", zone: "Terrace", seats: 10 },
];

export function getDefaultZoneForStatus(status: TableStatus): TableZone {
  if (status === "Occupied") return "VIP";
  if (status === "Reserved") return "Terrace";
  return "Garden";
}
