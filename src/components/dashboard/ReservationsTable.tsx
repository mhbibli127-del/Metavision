"use client";

import type { Reservation } from "@/data/reservations";
import { useI18n } from "@/lib/i18n-context";

type ReservationsTableProps = {
  reservations: Reservation[];
  onCancel: (id: string) => void;
  onDeposit?: (id: string, amount: number, paid: boolean) => void;
  onSms?: (id: string) => void;
};

function TableBadge({ table, isVip }: { table: string; isVip: boolean }) {
  return (
    <span className={`dash-table-badge${isVip ? " dash-table-badge--vip" : ""}`}>
      #{table}
      {isVip ? " VIP" : ""}
    </span>
  );
}

function StatusBadge({ status }: { status: Reservation["status"] }) {
  const className =
    status === "Confirmed" ? "dash-status dash-status--confirmed" : "dash-status dash-status--cancelled";
  return <span className={className}>{status}</span>;
}

export default function ReservationsTable({ reservations, onCancel, onDeposit, onSms }: ReservationsTableProps) {
  const { t } = useI18n();

  return (
    <div className="dash-table-wrap">
      <table className="dash-table dash-res-table">
        <thead>
          <tr>
            <th scope="col">{t("guestName")}</th>
            <th scope="col">{t("phone")}</th>
            <th scope="col">{t("tables")}</th>
            <th scope="col">{t("guests")}</th>
            <th scope="col">{t("reservations")}</th>
            <th scope="col">{t("status")}</th>
            <th scope="col">{t("deposit")}</th>
            <th scope="col">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id}>
              <td className="dash-res-guest">{reservation.guest}</td>
              <td>{reservation.phone}</td>
              <td>
                <TableBadge table={reservation.table} isVip={reservation.isVip} />
              </td>
              <td>{reservation.guests}</td>
              <td>
                <div className="dash-res-date-cell">
                  <span>{reservation.date}</span>
                  <span className="dash-res-day">{reservation.day} · {reservation.time}</span>
                </div>
              </td>
              <td>
                <StatusBadge status={reservation.status} />
              </td>
              <td>
                {onDeposit ? (
                  <div className="dash-staff-filters" style={{ gap: 4 }}>
                    <input
                      type="number"
                      min={0}
                      className="dash-menu-search-input"
                      style={{ width: 70 }}
                      defaultValue={reservation.depositAmount ?? 0}
                      onBlur={(e) =>
                        onDeposit(reservation.id, Number(e.target.value), Boolean(reservation.depositPaid))
                      }
                    />
                    <label>
                      <input
                        type="checkbox"
                        defaultChecked={reservation.depositPaid}
                        onChange={(e) =>
                          onDeposit(reservation.id, reservation.depositAmount ?? 0, e.target.checked)
                        }
                      />{" "}
                      {t("depositPaid")}
                    </label>
                  </div>
                ) : (
                  <span>{reservation.depositAmount ?? 0} AZN</span>
                )}
              </td>
              <td>
                <div className="dash-staff-filters" style={{ gap: 4 }}>
                  {reservation.status === "Confirmed" ? (
                    <button
                      type="button"
                      className="dash-res-cancel-btn"
                      onClick={() => onCancel(reservation.id)}
                    >
                      {t("cancelReservation")}
                    </button>
                  ) : null}
                  {onSms && reservation.status === "Confirmed" && !reservation.smsReminderSent ? (
                    <button type="button" className="dash-menu-btn-secondary" onClick={() => onSms(reservation.id)}>
                      {t("sendSmsReminder")}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
