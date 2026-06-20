export type ReservationStatus = "Confirmed" | "Cancelled";

export type Reservation = {
  id: string;
  guest: string;
  phone: string;
  table: string;
  isVip: boolean;
  guests: number;
  date: string;
  day: string;
  time: string;
  status: ReservationStatus;
};

/** Static mock data — replace with API/database later */
export const staticReservations: Reservation[] = [
  {
    id: "res-1",
    guest: "Ali Hasanov",
    phone: "050 123 23 32",
    table: "2",
    isVip: false,
    guests: 2,
    date: "21/06/2026",
    day: "Şənbə",
    time: "22:00",
    status: "Confirmed",
  },
  {
    id: "res-2",
    guest: "Nigar Qasimli",
    phone: "055 680 89 84",
    table: "11",
    isVip: false,
    guests: 11,
    date: "18/06/2026",
    day: "Çərşənbə",
    time: "18:53",
    status: "Confirmed",
  },
  {
    id: "res-3",
    guest: "Suren Mammadov",
    phone: "070 456 78 90",
    table: "12",
    isVip: true,
    guests: 5,
    date: "20/06/2026",
    day: "Cümə",
    time: "19:30",
    status: "Confirmed",
  },
  {
    id: "res-4",
    guest: "Leyla Aliyeva",
    phone: "051 234 56 78",
    table: "5",
    isVip: false,
    guests: 4,
    date: "19/06/2026",
    day: "Cümə axşamı",
    time: "20:15",
    status: "Cancelled",
  },
  {
    id: "res-5",
    guest: "Rauf Huseynov",
    phone: "050 987 65 43",
    table: "8",
    isVip: false,
    guests: 3,
    date: "17/06/2026",
    day: "Çərşənbə axşamı",
    time: "21:00",
    status: "Cancelled",
  },
];

export const AZ_WEEKDAYS = [
  "Bazar",
  "Bazar ertəsi",
  "Çərşənbə axşamı",
  "Çərşənbə",
  "Cümə axşamı",
  "Cümə",
  "Şənbə",
] as const;

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function getDayFromIso(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return AZ_WEEKDAYS[date.getDay()] ?? "";
}

export function getReservationStats(reservations: Reservation[]) {
  const active = reservations.filter((r) => r.status === "Confirmed").length;
  const cancelled = reservations.filter((r) => r.status === "Cancelled").length;
  const totalGuests = reservations
    .filter((r) => r.status === "Confirmed")
    .reduce((sum, r) => sum + r.guests, 0);

  return {
    total: reservations.length,
    active,
    cancelled,
    totalGuests,
  };
}
