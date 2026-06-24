"use client";

import { useEffect, useState } from "react";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  createdAt: string;
};

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditRow[]>([]);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.logs)) setLogs(d.logs);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="auditLogsTitle" subtitleKey="auditLogsSubtitle" />
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="dash-table-date">{new Date(log.createdAt).toLocaleString()}</td>
                <td><span className="dash-status dash-status--pending">{log.action}</span></td>
                <td>{log.entity}{log.entityId ? ` #${log.entityId}` : ""}</td>
                <td>{log.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
