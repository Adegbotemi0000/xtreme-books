import { useEffect, useState } from "react";
import { api } from "../api/client";

export function Trash() {
  const [rows, setRows] = useState([]);

  function load() {
    api.get("/trash").then(setRows);
  }
  useEffect(load, []);

  async function restore(row) {
    await api.post("/trash/restore", { entityType: row.entityType, id: row.id });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Trash</h1>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <div className="empty-state">Nothing archived.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Archived</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.entityType}-${r.id}`}>
                  <td>{r.entityType}</td>
                  <td>{r.name}</td>
                  <td>{new Date(r.deleted_at).toLocaleString()}</td>
                  <td>
                    <button className="btn secondary" onClick={() => restore(r)}>
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
