import type { RestaurantTable, TableStatus } from "@/data/tables";

type TablesGridProps = {
  tables: RestaurantTable[];
};

function statusClass(status: TableStatus): string {
  switch (status) {
    case "Available":
      return "dash-table-card-status dash-table-card-status--available";
    case "Occupied":
      return "dash-table-card-status dash-table-card-status--occupied";
    case "Reserved":
      return "dash-table-card-status dash-table-card-status--reserved";
  }
}

function zoneClass(zone: RestaurantTable["zone"]): string {
  switch (zone) {
    case "Garden":
      return "dash-table-card-zone dash-table-card-zone--garden";
    case "VIP":
      return "dash-table-card-zone dash-table-card-zone--vip";
    case "Terrace":
      return "dash-table-card-zone dash-table-card-zone--terrace";
  }
}

function TableShapeIcons() {
  return (
    <div className="dash-table-card-shapes" aria-hidden="true">
      <span className="dash-table-card-shape dash-table-card-shape--square" />
      <span className="dash-table-card-shape dash-table-card-shape--round" />
    </div>
  );
}

export default function TablesGrid({ tables }: TablesGridProps) {
  return (
    <>
      <div className="dash-tables-grid">
        {tables.map((table) => (
          <article key={table.id} className="dash-table-card">
            <span className={statusClass(table.status)}>{table.status}</span>
            <h3 className="dash-table-card-title">Table #{table.number}</h3>
            <span className={zoneClass(table.zone)}>{table.zone}</span>
            <p className="dash-table-card-seats">{table.seats} seats</p>
            <TableShapeIcons />
          </article>
        ))}
      </div>

      <div className="dash-tables-legend" aria-label="Status legend">
        <span className="dash-tables-legend-item">
          <i className="dash-tables-legend-dot dash-tables-legend-dot--available" />
          Available
        </span>
        <span className="dash-tables-legend-item">
          <i className="dash-tables-legend-dot dash-tables-legend-dot--occupied" />
          Occupied
        </span>
        <span className="dash-tables-legend-item">
          <i className="dash-tables-legend-dot dash-tables-legend-dot--reserved" />
          Reserved
        </span>
      </div>
    </>
  );
}
