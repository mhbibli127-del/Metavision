import type { Reservation } from "@/data/reservations";

type ReservationsTableProps = {
  reservations: Reservation[];
  onCancel: (id: string) => void;
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

export default function ReservationsTable({ reservations, onCancel }: ReservationsTableProps) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table dash-res-table">
        <thead>
          <tr>
            <th scope="col">GUEST</th>
            <th scope="col">PHONE</th>
            <th scope="col">TABLE</th>
            <th scope="col">GUESTS</th>
            <th scope="col">DATE</th>
            <th scope="col">TIME</th>
            <th scope="col">STATUS</th>
            <th scope="col">ACTION</th>
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
                  <span className="dash-res-day">{reservation.day}</span>
                </div>
              </td>
              <td>{reservation.time}</td>
              <td>
                <StatusBadge status={reservation.status} />
              </td>
              <td>
                {reservation.status === "Confirmed" ? (
                  <button
                    type="button"
                    className="dash-res-cancel-btn"
                    onClick={() => onCancel(reservation.id)}
                  >
                    Cancel
                  </button>
                ) : (
                  <span className="dash-res-cancel-disabled">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
