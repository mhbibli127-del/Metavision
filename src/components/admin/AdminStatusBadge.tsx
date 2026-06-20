import type { AdminClientStatus } from "@/data/admin-clients";

const statusClass: Record<AdminClientStatus, string> = {
  Active: "admin-status--active",
  Pending: "admin-status--pending",
  Trial: "admin-status--trial",
  Waiting: "admin-status--waiting",
  Test: "admin-status--test",
};

export default function AdminStatusBadge({ status }: { status: AdminClientStatus }) {
  return <span className={`admin-status ${statusClass[status]}`}>{status}</span>;
}
