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
  depositAmount?: number;
  depositPaid?: boolean;
  smsReminderSent?: boolean;
};

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
