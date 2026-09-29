import { useEffect, useState } from "react";
import { api } from "../api/client";

export function Logs() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/logs").then(setRows);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Audit Log</h1>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <div className="empty-state">No activity recorded yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.user_name || "System"}</td>
                  <td>{r.action}</td>
                  <td>
                    {r.entity_type} #{r.entity_id}
                  </td>
                  <td>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
